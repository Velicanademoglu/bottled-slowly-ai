interface Props {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-white/5 text-star-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
