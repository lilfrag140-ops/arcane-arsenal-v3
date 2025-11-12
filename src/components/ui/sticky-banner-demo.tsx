import { StickyBanner } from "@/components/ui/sticky-banner";

export default function StickyBannerDemo() {
  return (
    <StickyBanner className="bg-gradient-to-r from-primary to-secondary">
      <p className="mx-0 max-w-[90%] text-black font-medium drop-shadow-md text-center">
        Do you wish to supply for us? We are looking for suppliers.{" "}
        <a 
          href="https://discord.com/invite/donutgroceries" 
          target="_blank"
          rel="noopener noreferrer"
          className="transition duration-200 hover:underline font-semibold"
        >
          Create a ticket on the discord
        </a>
      </p>
    </StickyBanner>
  );
}