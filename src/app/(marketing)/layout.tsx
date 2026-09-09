import { LandingNav } from "@/components/LandingNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#070b17]">
      <LandingNav />
      {children}
    </div>
  );
}