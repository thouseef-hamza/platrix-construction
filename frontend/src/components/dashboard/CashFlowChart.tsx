"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CashFlowChart() {
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
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
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
        formatter: (val: number) => `₹ ${(val / 1000).toFixed(0)}K`,
      },
    },
  };

  const series = [
    { name: "Invoices", data: [420, 380, 510, 480, 600, 550, 620, 580, 640, 720, 680, 750] },
    { name: "Expenses", data: [280, 320, 290, 310, 350, 380, 400, 420, 390, 450, 430, 480] },
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
