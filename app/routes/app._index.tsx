import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  TextField,
  Checkbox,
  DataTable,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.settings.findUnique({
    where: { shop },
  }) || { buttonText: "Request EU Withdrawal", emailNotify: false };

  const requests = await prisma.withdrawalRequest.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return json({ settings, requests, shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const buttonText = formData.get("buttonText") as string;
  const emailNotify = formData.get("emailNotify") === "true";

  const settings = await prisma.settings.upsert({
    where: { shop },
    update: { buttonText, emailNotify },
    create: { shop, buttonText, emailNotify },
  });

  // Sync settings to metafield for storefront access
  await admin.graphql(
    `#graphql
    mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            namespace: "eu_withdrawal",
            key: "settings",
            type: "json",
            value: JSON.stringify({ buttonText, emailNotify }),
            ownerId: `gid://shopify/Shop/${(await admin.graphql("{ shop { id } }").then(res => res.json())).data.shop.id.split("/").pop()}`,
          },
        ],
      },
    }
  );

  return json({ settings, success: true });
};

export default function Index() {
  const { settings, requests } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [emailNotify, setEmailNotify] = useState(settings.emailNotify);

  const isLoading = navigation.state === "submitting";

  const handleSave = () => {
    submit({ buttonText, emailNotify: String(emailNotify) }, { method: "POST" });
  };

  const rows = requests.map((req) => [
    req.orderNumber,
    req.orderId,
    new Date(req.createdAt).toLocaleString(),
  ]);

  return (
    <Page title="EU Right of Withdrawal Settings">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Storefront Configuration
                </Text>
                <TextField
                  label="Button Text"
                  value={buttonText}
                  onChange={(value) => setButtonText(value)}
                  autoComplete="off"
                  helpText="Text displayed on the withdrawal button in the storefront."
                />
                <Checkbox
                  label="Email Notification"
                  checked={emailNotify}
                  onChange={(value) => setEmailNotify(value)}
                  helpText="Receive an email notification when a customer submits a withdrawal request."
                />
                <InlineStack align="end">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={isLoading}
                  >
                    Save Settings
                  </Button>
                </InlineStack>
                {actionData?.success && (
                  <Box padding="200" background="bg-surface-success" borderRadius="200">
                    <Text as="p" tone="success">Settings saved successfully!</Text>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Recent Withdrawal Requests
                </Text>
                {requests.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text"]}
                    headings={["Order Number", "Order ID", "Date"]}
                    rows={rows}
                  />
                ) : (
                  <Text as="p">No withdrawal requests found.</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
