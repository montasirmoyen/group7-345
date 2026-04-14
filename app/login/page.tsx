import Login from "@/components/login-page";

type LoginPageProps = {
  searchParams?: {
    verifyEmail?: string;
  };
};

export default function LogInPage({ searchParams }: LoginPageProps) {
  const shouldShowVerifyBanner = searchParams?.verifyEmail === "1";

  return (
    <div>
      <Login shouldShowVerifyBanner={shouldShowVerifyBanner} />
    </div>
  );
}
