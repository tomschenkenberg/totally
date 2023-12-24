import Title from "@/components/title";
import dynamic from "next/dynamic";

const Round = dynamic(() => import("@/components/round"), {
  ssr: false,
});

export default function RoundPage({ params }: { params: { round: string } }) {
  return (
    <>
      <Title>Round {params.round}</Title>
      <Round round={Number(params.round)} />
    </>
  );
}
