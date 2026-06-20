import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>EU Right of Withdrawal Compliance</h1>
        <p className={styles.text}>
          Simplify EU consumer rights management and stay compliant with ease.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="my-shop.myshopify.com"
              />
            </label>
            <button className={styles.button} type="submit">
              Install App
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Automated Tagging</strong>
            <p>Orders are instantly tagged when a withdrawal is requested, keeping your fulfillment team informed.</p>
          </li>
          <li>
            <strong>Customizable Button</strong>
            <p>Seamlessly integrate a withdrawal request button into your Customer Account or Order Status pages.</p>
          </li>
          <li>
            <strong>Legal Compliance</strong>
            <p>Meet EU consumer protection requirements without the manual overhead of tracking requests.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
