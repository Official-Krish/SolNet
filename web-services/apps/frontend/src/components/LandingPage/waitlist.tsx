import { VanishInput } from "../ui/vanish-input";
import { useState } from "react";
import { Spotlight } from "../ui/spotLight";
import { toast } from "sonner";

export default function WaitList() {
  const [email, setEmail] = useState("");
  const placeholders = [
    "Enter your email to join the waitlist",
    "Stay updated with the latest news",
    "Be the first to know about our launch",
    "Exclusive updates for early members",
    "Your gateway to the future of tech",
  ];
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setEmail("");
      toast.success("Successfully added to the waitlist!");
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      toast.error("Failed to add to the waitlist. Please try again.");
    }
  };
  return (
    <div className="h-[40rem] rounded-md dark:bg-neutral-950 bg-neutral-100 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50 text-center font-sans font-bold">
          Join the waitlist
        </h1>
        <div className="mt-6"/>
        <VanishInput
          placeholders={placeholders}
          onChange={(e) => setEmail(e.target.value)}
          onSubmit={onSubmit}
        />
      </div>
      <Spotlight/>
    </div>
  );
}
