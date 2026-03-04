import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Blackfox",
  description: "Sign in to Blackfox construction software",
};

export default function SignIn() {
  return <SignInForm />;
}
