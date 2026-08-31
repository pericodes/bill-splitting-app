import JoinPage from "./JoinPage";

export default async function JoinRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JoinPage token={token} />;
}
