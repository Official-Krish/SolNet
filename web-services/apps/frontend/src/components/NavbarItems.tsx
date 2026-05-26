"use client";
import { useState } from "react";
import { Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function NavbarItems({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={cn(className, "cursor-pointer")}>
      <Menu setActive={setActive}>
        <MenuItem
          setActive={setActive}
          active={active}
          item="Earn with Hardware"
        >
          <div className="text-sm grid grid-cols-1 gap-6 px-4 py-1 min-w-[260px]">
            <ProductItem
              title="Host Dashboard"
              href="/depin/host/dashboard"
              src="https://assets.krishdev.xyz/DeCloud/dashboard.png"
              description="Monitor earnings and manage your compute nodes."
            />
            <ProductItem
              title="Register Your Machine"
              href="/depin/register"
              src="https://assets.krishdev.xyz/DeCloud/registrationForm.png"
              description="Turn idle hardware into SOL revenue in minutes."
            />
            <ProductItem
              title="How Hosting Works"
              href="/hosting"
              src="https://assets.krishdev.xyz/DeCloud/RegistrationSteps.png"
              description="See how to join the network and start earning."
            />
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
