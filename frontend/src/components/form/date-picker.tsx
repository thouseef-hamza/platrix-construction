import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  /** Controlled value (YYYY-MM-DD). Use with onChange for controlled usage. */
  value?: string;
  label?: string;
  placeholder?: string;
  /** When true, input shows red border for validation error. */
  error?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  value,
  placeholder,
  error,
}: PropsType) {
  const instanceRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    const initialDate = value ?? defaultDate;
    const fp = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: initialDate,
      onChange,
    });
    instanceRef.current = Array.isArray(fp) ? fp[0] : fp;

    return () => {
      const instance = Array.isArray(fp) ? fp[0] : fp;
      if (instance) instance.destroy();
      instanceRef.current = null;
    };
  }, [mode, onChange, id]);

  useEffect(() => {
    if (value === undefined) return;
    const instance = instanceRef.current;
    if (!instance) return;
    instance.setDate(value, true);
  }, [value]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className={
            "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:ring-brand-500/20 "
            + (error ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400" : "border-gray-300 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800")
          }
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
