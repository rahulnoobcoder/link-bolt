import {
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineLightningBolt,
} from 'react-icons/hi';

const features = [
  {
    icon: HiOutlineShieldCheck,
    title: 'Secure by Default',
    desc: 'Unique, unguessable URLs. No indexing.',
  },
  {
    icon: HiOutlineClock,
    title: 'Auto-Expiry',
    desc: 'Content self-deletes. 10 min default.',
  },
  {
    icon: HiOutlineFire,
    title: 'Burn After Reading',
    desc: 'One-time view, then gone forever.',
  },
  {
    icon: HiOutlineLockClosed,
    title: 'Password Protection',
    desc: 'Add an extra layer of access control.',
  },
  {
    icon: HiOutlineEye,
    title: 'View Limits',
    desc: 'Cap the number of accesses.',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'User Dashboard',
    desc: 'Manage, track, and delete from one place.',
  },
];

export default function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {features.map((f) => (
        <div
          key={f.title}
          className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50/60 border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all group"
        >
          <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-100 transition-colors">
            <f.icon className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-neutral-800">{f.title}</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
