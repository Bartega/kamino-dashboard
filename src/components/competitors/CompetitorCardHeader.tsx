import { formatUsd } from "@/lib/utils/format";

export function CompetitorCardHeader({
  displayName,
  handle,
  profilePicture,
  tvl,
}: {
  displayName: string;
  handle: string;
  profilePicture: string;
  tvl: number;
}) {
  return (
    <div className="bg-accent p-4 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={profilePicture}
        alt={displayName}
        className="w-10 h-10 rounded-full border-2 border-card"
        width={40}
        height={40}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {displayName}
        </p>
        <p className="text-xs text-liquidity-blue">@{handle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-liquidity-blue">TVL</p>
        <p className="text-sm font-bold text-white font-mono">
          {formatUsd(tvl)}
        </p>
      </div>
    </div>
  );
}
