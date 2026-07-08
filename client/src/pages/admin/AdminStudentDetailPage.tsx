import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Combobox,
  ErrorState,
  Modal,
  ProgressRing,
  SegmentedControl,
  Skeleton,
  useToast,
  BanIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  FlameIcon,
  GiftIcon,
  GraduationIcon,
  LogOutIcon,
  ReceiptIcon,
  RefreshIcon,
  ShieldIcon,
  UserIcon,
  type BadgeTone,
  type ComboOption,
} from '../../components/ui';
import { Breadcrumbs } from '../../components/layout';
import { ConfirmDialog, IconChip } from './admin-shared';
import { useDisclosure } from '../../hooks';
import { CatalogPicker, type CatalogSelection } from '../../features/catalog';
import {
  consoleApi,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminUserRole,
  type UserDetail,
} from '../../features/admin/console.api';
import { adminLessonsApi } from '../../features/admin/admin-lessons.api';
import { commerceApi } from '../../features/commerce/commerce.api';
import { errorMessage } from '../../features/auth/auth.api';
import { formatINR, formatMinutes } from '../../lib/format';

/* ---------------- shared maps + helpers ---------------- */

const ROLE_TONE: Record<AdminUserRole, BadgeTone> = {
  student: 'neutral',
  admin: 'primary',
  superadmin: 'gold',
};
const ROLE_LABEL: Record<AdminUserRole, string> = {
  student: 'Student',
  admin: 'Admin',
  superadmin: 'Superadmin',
};
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

const STATUS_TONE: Record<AdminOrderStatus, BadgeTone> = {
  created: 'warn',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
};
const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  created: 'Created',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ---------------- page ---------------- */

export function AdminStudentDetailPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => consoleApi.user(id!),
    enabled: !!id,
  });
  const d = q.data;

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: 'Admin', to: '/admin' },
          { label: 'Students', to: '/admin/students' },
          { label: d?.name ?? 'Student' },
        ]}
      />

      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : d ? (
        <StudentDetail data={d} />
      ) : (
        <ErrorState message="Student not found." />
      )}
    </>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton shape="block" className="h-28" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} shape="block" className="h-28" />
        ))}
      </div>
      <Skeleton shape="block" className="h-64" />
    </div>
  );
}

/* ---------------- detail (id + data guaranteed) ---------------- */

function StudentDetail({ data }: { data: UserDetail }) {
  const grant = useDisclosure();
  const [roleTarget, setRoleTarget] = useState<AdminUserRole | null>(null);
  const [confirm, setConfirm] = useState<'disable' | 'logout' | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);

  const userKey = ['admin', 'user', data.id];
  const usersKey = ['admin', 'users'];
  const ordersKey = ['admin', 'orders'];
  const overviewKey = ['admin', 'overview'];

  const s = data.stats;

  return (
    <div className="pf-stagger space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="pf-lift overflow-hidden rounded-card bg-navy-900 text-white shadow-card">
        <div className="bg-gradient-to-br from-white/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar name={data.name} src={data.avatarUrl} size="lg" className="h-14 w-14 text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {data.name}
                </h1>
                <Badge tone={ROLE_TONE[data.role]} size="sm">
                  {ROLE_LABEL[data.role]}
                </Badge>
                {data.disabled ? (
                  <Badge tone="danger" size="sm">
                    Disabled
                  </Badge>
                ) : null}
                {!data.emailVerified ? (
                  <Badge tone="warn" size="sm">
                    Unverified
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 truncate text-sm text-white/70">{data.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon size={13} /> Joined {formatDate(data.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserIcon size={13} /> {data.phone ?? 'No phone'}
                </span>
                {data.activeStage ? (
                  <span className="inline-flex items-center gap-1">
                    <GraduationIcon size={13} /> {data.activeStage.categoryName} · {data.activeStage.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section>
        <Eyebrow icon={<GraduationIcon size={13} />} className="mb-3">
          Study stats
        </Eyebrow>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <MetricTile tone="primary" label="Momentum" ring={s.momentum} foot="out of 100" />
          <MetricTile
            tone="success"
            label="Syllabus"
            ring={s.syllabus.percent}
            foot={`${s.syllabus.completed}/${s.syllabus.total} lessons`}
          />
          <MetricTile
            tone="gold"
            icon={<FlameIcon size={18} />}
            label="Streak"
            value={s.streak}
            foot={`day${s.streak === 1 ? '' : 's'} in a row`}
          />
          <MetricTile
            tone="info"
            icon={<ClockIcon size={18} />}
            label="Study time"
            value={formatMinutes(s.totalStudyMinutes)}
            foot="total logged"
          />
          <MetricTile
            tone="primary"
            icon={<RefreshIcon size={18} />}
            label="Sessions"
            value={s.sessionCount}
            foot="study sessions"
          />
          <MetricTile
            tone="success"
            icon={<CheckCircleIcon size={18} />}
            label="Completed"
            value={s.completedLessons}
            foot="lessons finished"
          />
          <MetricTile
            tone="primary"
            icon={<FileTextIcon size={18} />}
            label="Owned lessons"
            value={s.ownedLessonCount}
            foot="unlocked"
          />
          <MetricTile
            tone="gold"
            icon={<RefreshIcon size={18} />}
            label="Revisions"
            value={s.totalRevisions}
            foot="revisions marked"
          />
        </div>
      </section>

      {/* Body: controls + lists */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left column */}
        <div className="space-y-4 lg:space-y-6">
          {/* Controls */}
          <Card>
            <Eyebrow icon={<ShieldIcon size={13} />}>Controls</Eyebrow>
            <div className="mt-3 space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-fg">Role</p>
                <SegmentedControl
                  fullWidth
                  size="sm"
                  aria-label="Change role"
                  value={data.role}
                  options={ROLE_OPTIONS}
                  onChange={(v) => {
                    if (v !== data.role) setRoleTarget(v as AdminUserRole);
                  }}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Controls console access. You can’t change your own role.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  leftIcon={<GiftIcon size={16} />}
                  onClick={grant.open}
                >
                  Grant access
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<LogOutIcon size={16} />}
                  onClick={() => setConfirm('logout')}
                >
                  Force logout
                </Button>
                <Button
                  variant={data.disabled ? 'secondary' : 'danger'}
                  leftIcon={<BanIcon size={16} />}
                  className="sm:col-span-2"
                  onClick={() => setConfirm('disable')}
                >
                  {data.disabled ? 'Enable account' : 'Disable account'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Owned lessons */}
          <Card>
            <Eyebrow icon={<FileTextIcon size={13} />}>Owned lessons</Eyebrow>
            {data.ownedLessons.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No lessons owned yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.ownedLessons.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sunken/50 py-1 pl-2.5 pr-1.5 text-xs"
                  >
                    <span className="max-w-[14rem] truncate font-medium text-fg">{l.title}</span>
                    <Badge tone="neutral" size="sm">
                      {l.type === 'pdf' ? 'PDF' : 'Link'}
                    </Badge>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Active sessions */}
          <Card>
            <Eyebrow icon={<LogOutIcon size={13} />}>Active sessions</Eyebrow>
            {data.activeSessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No active sessions.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.activeSessions.map((sess, i) => (
                  <li key={i} className="rounded-field border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-fg">{sess.ip ?? 'Unknown IP'}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {sess.lastActiveAt ? formatDateTime(sess.lastActiveAt) : '—'}
                      </span>
                    </div>
                    {sess.userAgent ? (
                      <p className="mt-1 truncate text-xs text-muted">{sess.userAgent}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          {/* Purchases */}
          <Card flush>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-fg">Purchases</h2>
              <span className="text-xs text-muted">
                {data.orders.length} order{data.orders.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="divide-y divide-line">
              {data.orders.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">No purchases yet.</p>
              ) : (
                data.orders.map((o) => (
                  <OrderRow key={o.id} order={o} onRefund={() => setRefundTarget(o)} />
                ))
              )}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <Eyebrow icon={<ClockIcon size={13} />}>Recent activity</Eyebrow>
            {data.accessLogs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No views recorded.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {data.accessLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <EyeIcon size={14} className="shrink-0 text-faint" />
                      <span className="min-w-0 truncate text-sm text-fg">{log.lessonTitle}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                      {log.ip ? <span className="font-mono">{log.ip}</span> : null}
                      <span>{formatDateTime(log.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Confirms + grant modal */}
      {roleTarget ? (
        <ConfirmDialog
          open
          onClose={() => setRoleTarget(null)}
          title={`Change role to ${ROLE_LABEL[roleTarget]}?`}
          description={
            <>
              This changes what <strong className="text-fg">{data.name}</strong> can do across the
              console. You can’t change your own role.
            </>
          }
          confirmLabel="Change role"
          onConfirm={() => consoleApi.setRole(data.id, roleTarget)}
          invalidate={[userKey, usersKey, overviewKey]}
          success="Role updated"
        />
      ) : null}

      {confirm === 'disable' ? (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          title={data.disabled ? `Enable ${data.name}?` : `Disable ${data.name}?`}
          description={
            data.disabled
              ? 'They will be able to sign in again from any device.'
              : 'This blocks every sign-in and immediately ends all of their active sessions.'
          }
          confirmLabel={data.disabled ? 'Enable account' : 'Disable account'}
          onConfirm={() => consoleApi.setDisabled(data.id, !data.disabled)}
          invalidate={[userKey, usersKey, overviewKey]}
          success={data.disabled ? 'Account enabled' : 'Account disabled'}
        />
      ) : null}

      {confirm === 'logout' ? (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          title={`Force logout ${data.name}?`}
          description="Ends every active session on all devices. They’ll need to sign in again — the account stays enabled."
          confirmLabel="Force logout"
          onConfirm={() => consoleApi.forceLogout(data.id)}
          invalidate={[userKey]}
          success="All sessions ended"
        />
      ) : null}

      {refundTarget ? (
        <ConfirmDialog
          open
          onClose={() => setRefundTarget(null)}
          title="Refund / revoke this order?"
          description="This revokes the access this order granted — in-app only, no money is moved through the payment gateway. The student loses any lessons this order unlocked."
          confirmLabel="Refund & revoke"
          onConfirm={() => consoleApi.refundOrder(refundTarget.id)}
          invalidate={[userKey, ordersKey, overviewKey]}
          success="Order refunded"
        />
      ) : null}

      {grant.isOpen ? (
        <GrantAccessModal open onClose={grant.close} userId={data.id} userName={data.name} />
      ) : null}
    </div>
  );
}

/* ---------------- order row ---------------- */

function OrderRow({ order, onRefund }: { order: AdminOrder; onRefund: () => void }) {
  const first = order.items[0];
  const extra = order.itemCount - 1;
  const isGrant = order.source === 'admin_grant';
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <IconChip
          size="sm"
          tone={isGrant ? 'gold' : 'primary'}
          icon={isGrant ? <GiftIcon size={16} /> : <ReceiptIcon size={16} />}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            {first ? first.title : 'Order'}
            {extra > 0 ? <span className="font-normal text-muted"> +{extra} more</span> : null}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span>{formatDate(order.createdAt)}</span>
            {order.receiptNumber ? <span className="font-mono">{order.receiptNumber}</span> : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isGrant ? (
            <Badge tone="gold" size="sm">
              Comp
            </Badge>
          ) : (
            <span className="text-sm font-bold tabular text-fg">{formatINR(order.amount)}</span>
          )}
          <Badge tone={STATUS_TONE[order.status]} size="sm">
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>
      </div>
      {order.status === 'paid' ? (
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:text-danger"
            leftIcon={<RefreshIcon size={15} />}
            onClick={onRefund}
          >
            Refund / revoke
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- grant access modal ---------------- */

function GrantAccessModal({
  open,
  onClose,
  userId,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<'lesson' | 'package'>('lesson');
  const [sel, setSel] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const lessons = useQuery({
    queryKey: ['admin', 'lessons', sel.subjectId],
    queryFn: () => adminLessonsApi.list(sel.subjectId as string),
    enabled: type === 'lesson' && Boolean(sel.subjectId),
  });
  const packages = useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: commerceApi.adminPackages,
    enabled: type === 'package',
  });

  const lessonOptions: ComboOption[] =
    lessons.data?.map((l) => ({ value: l.id, label: l.title })) ?? [];
  const packageOptions: ComboOption[] =
    packages.data?.map((p) => ({ value: p.id, label: p.title })) ?? [];

  const refId = type === 'lesson' ? lessonId : packageId;

  const mutation = useMutation({
    mutationFn: () => consoleApi.grant(userId, type, refId as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Access granted');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit() {
    setError('');
    if (!refId) {
      setError(type === 'lesson' ? 'Pick a lesson to grant.' : 'Pick a package to grant.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grant access"
      description={`Give ${userName} a lesson or package at no charge. This records a comped order.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending} disabled={!refId}>
            Grant access
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <SegmentedControl
          fullWidth
          aria-label="Grant type"
          value={type}
          options={[
            { value: 'lesson', label: 'Lesson' },
            { value: 'package', label: 'Package' },
          ]}
          onChange={(v) => {
            setType(v as 'lesson' | 'package');
            setError('');
          }}
        />

        {type === 'lesson' ? (
          <div className="space-y-3">
            <CatalogPicker
              value={sel}
              onChange={(next) => {
                setSel(next);
                setLessonId(null);
              }}
            />
            {sel.subjectId ? (
              lessons.isLoading ? (
                <Skeleton className="h-11" />
              ) : lessonOptions.length === 0 ? (
                <p className="text-sm text-muted">This subject has no lessons yet.</p>
              ) : (
                <Combobox
                  label="Lesson"
                  value={lessonId}
                  options={lessonOptions}
                  placeholder="Select a lesson"
                  onChange={setLessonId}
                />
              )
            ) : (
              <p className="text-sm text-muted">Pick a subject to list its lessons.</p>
            )}
          </div>
        ) : (
          <Combobox
            label="Package"
            value={packageId}
            options={packageOptions}
            placeholder={packages.isLoading ? 'Loading…' : 'Select a package'}
            onChange={setPackageId}
          />
        )}
      </div>
    </Modal>
  );
}

/* ---------------- small building blocks ---------------- */

function Eyebrow({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted${
        className ? ` ${className}` : ''
      }`}
    >
      {icon}
      {children}
    </p>
  );
}

type TileTone = 'primary' | 'gold' | 'success' | 'info';

const TILE_WASH: Record<TileTone, string> = {
  primary: 'from-primary-soft/70',
  gold: 'from-gold-soft/70',
  success: 'from-success-soft/70',
  info: 'from-info-soft/70',
};
const TILE_CHIP: Record<TileTone, string> = {
  primary: 'bg-primary-soft text-primary-soft-fg',
  gold: 'bg-gold-soft text-gold-soft-fg',
  success: 'bg-success-soft text-success-fg',
  info: 'bg-info-soft text-info-fg',
};
const TILE_RING: Record<TileTone, 'primary' | 'gold' | 'success'> = {
  primary: 'primary',
  gold: 'gold',
  success: 'success',
  info: 'primary',
};

function MetricTile({
  tone,
  label,
  value,
  foot,
  icon,
  ring,
}: {
  tone: TileTone;
  label: string;
  value?: ReactNode;
  foot?: string;
  icon?: ReactNode;
  ring?: number;
}) {
  return (
    <div
      className={`pf-lift rounded-card border border-line bg-gradient-to-br ${TILE_WASH[tone]} to-transparent p-4 shadow-card`}
    >
      {ring !== undefined ? (
        <div className="flex items-center gap-3">
          <ProgressRing value={ring} size={56} strokeWidth={6} tone={TILE_RING[tone]} label={label}>
            <span className="font-display text-sm font-extrabold tabular text-fg">
              {Math.round(ring)}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            {foot ? <p className="mt-0.5 text-xs text-muted">{foot}</p> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            {icon ? (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TILE_CHIP[tone]}`}
              >
                {icon}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 font-display text-[26px] font-extrabold tracking-tight tabular text-fg">
            {value}
          </p>
          {foot ? <p className="mt-0.5 text-xs text-muted">{foot}</p> : null}
        </>
      )}
    </div>
  );
}
