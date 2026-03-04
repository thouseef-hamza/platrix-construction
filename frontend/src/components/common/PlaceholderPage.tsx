import React from "react";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>
      {description && (
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
        This section is under development. Content will be added here.
      </p>
    </div>
  );
}
