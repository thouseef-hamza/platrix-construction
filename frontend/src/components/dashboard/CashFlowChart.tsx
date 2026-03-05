"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { DashboardCashFlow } from "@/lib/dashboardApi";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const DEFAULT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function CashFlowChart({
  cashFlow,
}: {
  cashFlow?: DashboardCashFlow | null;
}) {
  const months = cashFlow?.months ?? DEFAULT_MONTHS;
  const invoicesData = cashFlow?.invoices ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const expensesData = cashFlow?.expenses ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const options: ApexOptions = {
    colors: ["#10b981", "#f59e0b"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      toolbar: { show: false },
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val: number) => `QAR ${(val / 1000).toFixed(0)}K`,
      },
    },
  };

  const series = [
    { name: "Invoices", data: invoicesData },
    { name: "Expenses", data: expensesData },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:py-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Cash flow (Invoices vs Expenses)
      </h3>
      <div className="-ml-2">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={280}
        />
      </div>
    </div>
  );
}
