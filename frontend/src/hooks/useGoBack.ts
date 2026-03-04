import { useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";

const useGoBack = () => {
  const router = useRouter();
  const { basePath } = useCompany();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(basePath ?? "/");
    }
  };

  return goBack;
};

export default useGoBack;
