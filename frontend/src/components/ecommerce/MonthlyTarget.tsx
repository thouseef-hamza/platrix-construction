"use client";

import BudgetGauge from "@/components/common/BudgetGauge";

export default function MonthlyTarget() {
  return (
    <BudgetGauge
      title="Monthly Target"
      subtitle="Target you've set for each month"
      percent={75.55}
      changePercent={10}
      showDropdown={true}
      message="You earn $3287 today, it's higher than last month. Keep up your good work!"
      stats={[
        { label: "Target", value: "$20K", trend: "down" },
        { label: "Revenue", value: "$20K", trend: "up" },
        { label: "Today", value: "$20K", trend: "up" },
      ]}
    />
  );
}
