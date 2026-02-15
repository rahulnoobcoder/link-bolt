import { HiOutlineInbox } from 'react-icons/hi';

export default function EmptyState({ title, description, icon: Icon = HiOutlineInbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-neutral-300" />
      </div>
      <h3 className="text-base font-semibold text-neutral-400 mb-1">{title}</h3>
      <p className="text-sm text-neutral-300 max-w-xs text-center">{description}</p>
    </div>
  );
}
