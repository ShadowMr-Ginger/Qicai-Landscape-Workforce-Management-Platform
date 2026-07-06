"use client";

import { Wrench } from "lucide-react";
import ServiceItemManager from "../service-item-manager";

export default function CommonServicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-foreground">常用服务</h2>
      </div>
      <ServiceItemManager />
    </div>
  );
}
