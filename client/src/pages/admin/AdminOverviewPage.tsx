import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Badge,
  Card,
  ErrorState,
  Skeleton,
  ArrowRightIcon,
  GiftIcon,
  PackageIcon,
  FileTextIcon,
  UsersIcon,
  WalletIcon,
  ReceiptIcon,
  TrendingUpIcon,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { TrendChart, BarChart } from '../../components/admin/Charts';
import { consoleApi } from '../../features/admin/console.api';
import { errorMessage } from '../../features/auth/auth.api';
import { formatINR } from '../../lib/format';

export function AdminOverviewPage() {
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: consoleApi.overview });
  const d = q.data;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }]}
        title="Overview"
        description="Everything happening across Parallax Flow at a glance."
      />

      {q.isLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} shape="block" className="h-28" />
            ))}
          </div>
          <Skeleton shape="block" className="h-64" />
        </div>
      )}

      {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />}

      {d && (
        <div className="pf-stagger space-y-4 lg:space-y-6">
          {/* Headline metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <MetricCard
              tone="gold"
              icon={<WalletIcon size={18} />}
              label="Total revenue"
              value={formatINR(d.revenue.totalPaise)}
              foot={`This month ${formatINR(d.revenue.monthPaise)}`}
            />
            <MetricCard
              tone="primary"
              icon={<UsersIcon size={18} />}
              label="Students"
              value={<AnimatedNumber value={d.students.total} />}
              foot={`+${d.students.newThisWeek} this week`}
            />
            <MetricCard
              tone="success"
              icon={<ReceiptIcon size={18} />}
              label="Paid orders"
              value={<AnimatedNumber value={d.orders.paid} />}
              foot={`${d.orders.failed} failed · ${d.orders.refunded} refunded`}
            />
            <MetricCard
              tone="info"
              icon={<WalletIcon size={18} />}
              label="Today"
              value={formatINR(d.revenue.todayPaise)}
              foot="revenue today"
            />
          </div>

          {/* Revenue trend + signups */}
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
                    <TrendingUpIcon size={14} />
                    Revenue · last 30 days
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold tabular text-fg">
                    {formatINR(d.revenueSeries.reduce((a, b) => a + b.paise, 0))}
                  </p>
                </div>
              </div>
              <TrendChart
                points={d.revenueSeries.map((r) => r.paise)}
                tone="gold"
                height={170}
                ariaLabel="Revenue over the last 30 days"
              />
            </Card>

            <Card>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                New students · 30 days
              </p>
              <p className="font-display text-2xl font-extrabold tabular text-fg">
                <AnimatedNumber value={d.signupSeries.reduce((a, b) => a + b.count, 0)} />
              </p>
              <BarChart
                className="mt-4"
                data={d.signupSeries.map((s) => ({ label: s.date, value: s.count }))}
                tone="primary"
                height={130}
              />
            </Card>
          </div>

          {/* Recent orders + content library */}
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <Card flush className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-fg">Recent orders</h2>
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View all <ArrowRightIcon size={14} />
                </Link>
              </div>
              <div className="divide-y divide-line">
                {d.recentOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">No orders yet.</p>
                ) : (
                  d.recentOrders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/admin/students/${o.buyer.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
                        {o.source === 'admin_grant' ? <GiftIcon size={16} /> : <ReceiptIcon size={16} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{o.buyer.name}</p>
                        <p className="truncate text-xs text-muted">
                          {o.itemCount} item{o.itemCount === 1 ? '' : 's'} ·{' '}
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular text-fg">
                        {o.source === 'admin_grant' ? (
                          <Badge tone="gold" size="sm">
                            Comp
                          </Badge>
                        ) : (
                          formatINR(o.amount)
                        )}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Content library
              </p>
              <div className="grid grid-cols-2 gap-3">
                <CountTile icon={<FileTextIcon size={16} />} label="Lessons" value={d.content.lessons} />
                <CountTile icon={<PackageIcon size={16} />} label="Packages" value={d.content.packages} />
                <CountTile label="Subjects" value={d.content.subjects} />
                <CountTile label="Questions" value={d.content.questions} />
                <CountTile label="Stages" value={d.content.stages} />
                <CountTile label="Coupons" value={d.content.coupons} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({
  tone,
  icon,
  label,
  value,
  foot,
}: {
  tone: 'gold' | 'primary' | 'success' | 'info';
  icon: ReactNode;
  label: string;
  value: ReactNode;
  foot: string;
}) {
  const wash: Record<string, string> = {
    gold: 'from-gold-soft/70',
    primary: 'from-primary-soft/70',
    success: 'from-success-soft/70',
    info: 'from-info-soft/70',
  };
  const chip: Record<string, string> = {
    gold: 'bg-gold-soft text-gold-soft-fg',
    primary: 'bg-primary-soft text-primary-soft-fg',
    success: 'bg-success-soft text-success-fg',
    info: 'bg-info-soft text-info-fg',
  };
  return (
    <div className={`pf-lift rounded-card border border-line bg-gradient-to-br ${wash[tone]} to-transparent p-4 shadow-card`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip[tone]}`}>{icon}</span>
      </div>
      <p className="mt-1.5 font-display text-[26px] font-extrabold tracking-tight tabular text-fg">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{foot}</p>
    </div>
  );
}

function CountTile({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-field border border-line bg-sunken/50 p-3">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-display text-xl font-extrabold tabular text-fg">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
