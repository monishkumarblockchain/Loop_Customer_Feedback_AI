type StatCardProps = {
  title: string;
  value: string | number;
  note?: string;
};

export default function StatCard({
  title,
  value,
  note,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      {note && (
        <p className="mt-2 text-xs text-gray-400">
          {note}
        </p>
      )}
    </div>
  );
}