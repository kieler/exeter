import { PATH_DASHBOARD } from "@/routes";
import { redirect } from "next/navigation";

export default function Home() {
  redirect(PATH_DASHBOARD);
}
