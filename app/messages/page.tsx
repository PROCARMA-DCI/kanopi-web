import { MessagesPage } from "@/components/rates/MessagesPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages | Kanopi" };

export default function Page() {
  return <MessagesPage />;
}
