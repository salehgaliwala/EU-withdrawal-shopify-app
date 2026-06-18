import { json } from "@vercel/remix";
import type { ActionFunctionArgs } from "@vercel/remix";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.public.appProxy(request);
  const shop = session.shop;
  
  const body = await request.json();
  const { orderNumber, orderId } = body;

  if (!orderNumber || !orderId) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Log in database
    await prisma.withdrawalRequest.create({
      data: {
        shop,
        orderId: String(orderId),
        orderNumber: String(orderNumber),
      },
    });

    // 2. Tag order in Shopify
    const TAG_ORDER_MUTATION = `#graphql
      mutation tagOrder($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fullOrderId = orderId.startsWith("gid://shopify/Order/") 
      ? orderId 
      : `gid://shopify/Order/${orderId}`;

    await admin.graphql(TAG_ORDER_MUTATION, {
      variables: {
        id: fullOrderId,
        tags: ["EU_WITHDRAWAL_REQUESTED"],
      },
    });

    // 3. Optional: Send email if settings enabled
    const settings = await prisma.settings.findUnique({
      where: { shop },
    });

    if (settings?.emailNotify) {
      console.log(`[Email Notification] Withdrawal requested for order ${orderNumber} on shop ${shop}`);
      // In a real app, integrate with an email service here.
    }

    return json({ success: true });
  } catch (error) {
    console.error("Withdrawal API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const loader = () => {
  return json({ message: "Method not allowed" }, { status: 405 });
};
