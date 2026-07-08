import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  SegmentedControl,
  useToast,
  ChevronRightIcon,
  LibraryIcon,
  LogOutIcon,
  ShieldIcon,
} from '../components/ui';
import type { BadgeTone } from '../components/ui';
import { OrbitArt } from '../components/decor';
import { PageHeader } from '../components/layout';
import { CatalogPicker, type CatalogSelection } from '../features/catalog';
import { authApi, errorMessage } from '../features/auth/auth.api';
import { useLogout } from '../features/auth/useLogout';
import { trackerApi } from '../features/tracker/tracker.api';
import { useAuthStore, type AuthUser } from '../lib/auth-store';
import { useTheme, type Theme } from '../lib/theme';

const ROLE: Record<AuthUser['role'], { tone: BadgeTone; label: string }> = {
  student: { tone: 'neutral', label: 'Student' },
  admin: { tone: 'primary', label: 'Admin' },
  superadmin: { tone: 'gold', label: 'Super admin' },
};

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="pf-lift group flex min-h-11 items-center justify-between gap-3 rounded-field border border-transparent px-2.5 py-2 text-sm font-semibold text-fg hover:bg-sunken"
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg"
        >
          {icon}
        </span>
        {label}
      </span>
      <ChevronRightIcon
        size={16}
        className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-muted"
      />
    </Link>
  );
}

export function AccountPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const toast = useToast();
  const logout = useLogout();

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [studySel, setStudySel] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });

  const savePhone = useMutation({
    mutationFn: (value: string) => authApi.setPhone(value),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Phone number updated.');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update your phone number.')),
  });

  const saveStage = useMutation({
    mutationFn: () => trackerApi.settings({ activeStageId: studySel.stageId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracker'] });
      toast.success('Study preferences saved', {
        description: 'Notes, practice and your syllabus now follow this stage.',
      });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');
  const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (updated) => {
      setUser(updated);
      setAvatarError('');
      toast.success('Profile picture updated.');
    },
    onError: (err) => setAvatarError(errorMessage(err, 'Could not upload that image.')),
  });
  const removeAvatar = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Profile picture removed.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function pickAvatar(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Use a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5 MB or smaller.');
      return;
    }
    setAvatarError('');
    uploadAvatar.mutate(file);
  }

  if (!user) return null;

  const role = ROLE[user.role];
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const trimmedPhone = phone.trim();
  const canSavePhone =
    trimmedPhone.length > 0 && trimmedPhone !== (user.phone ?? '') && !savePhone.isPending;

  return (
    <>
      <PageHeader
        eyebrow="You"
        title="Account"
        description="Manage your profile, appearance and session."
      />

      <div className="pf-stagger mx-auto max-w-2xl space-y-4 lg:space-y-6">
        {/* Profile — navy identity strip over the editable details */}
        <Card flush className="overflow-hidden">
          <div className="pf-hero px-4 py-4 sm:px-5">
            <span className="pf-hero-ring -right-12 -top-20 h-52 w-52" aria-hidden="true" />
            <span className="pf-hero-ring-gold -right-6 -top-10 h-28 w-28" aria-hidden="true" />
            <OrbitArt className="pointer-events-none absolute -bottom-14 -left-12 h-40 w-40 text-white/15" />
            <div className="relative flex items-center gap-4">
              <Avatar name={user.name} src={user.avatarUrl} size="lg" className="ring-2 ring-white/25" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-lg font-bold text-white">{user.name}</h2>
                  <Badge tone={role.tone}>{role.label}</Badge>
                </div>
                <p className="truncate text-sm text-white/70">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {/* Profile picture */}
            <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-line pb-5">
              <Avatar name={user.name} src={user.avatarUrl} size="xl" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">Profile picture</p>
                <p className="text-xs text-muted">JPG, PNG or WebP · roughly square · up to 5 MB</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => pickAvatar(e.target.files?.[0] ?? undefined)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={uploadAvatar.isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    Change photo
                  </Button>
                  {user.avatarUrl?.startsWith('/api/users/') ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={removeAvatar.isPending}
                      onClick={() => removeAvatar.mutate()}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {avatarError ? (
                  <p className="mt-1.5 text-xs font-medium text-danger-fg">{avatarError}</p>
                ) : null}
              </div>
            </div>

            <Input
              label="Phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              hint="Used for account security and to reach you about purchases."
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => savePhone.mutate(trimmedPhone)}
                loading={savePhone.isPending}
                disabled={!canSavePhone}
              >
                Save
              </Button>
              {user.phone == null ? (
                <span className="text-xs font-medium text-warn-fg">No phone number on file yet.</span>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Study preferences — the exam/stage saved once, used app-wide */}
        <Card>
          <CardTitle>Study preferences</CardTitle>
          <CardDescription>
            Your exam and stage personalise Notes, Practice and the syllabus meter everywhere.
          </CardDescription>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CatalogPicker
              value={studySel}
              onChange={setStudySel}
              includeSubject={false}
              layout="stack"
            />
          </div>
          <Button
            className="mt-4"
            disabled={!studySel.stageId}
            loading={saveStage.isPending}
            onClick={() => saveStage.mutate()}
          >
            Save preferences
          </Button>
        </Card>

        {/* Appearance */}
        <Card>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Parallax Flow looks on this device.</CardDescription>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-fg">Theme</p>
              <p className="text-xs text-muted">Switch between light and dark.</p>
            </div>
            <SegmentedControl
              aria-label="Theme"
              value={theme}
              onChange={(v) => setTheme(v as Theme)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
        </Card>

        {/* Quick links */}
        <Card>
          <CardTitle>Quick links</CardTitle>
          <div className="mt-3 space-y-1">
            <QuickLink to="/library" icon={<LibraryIcon size={18} />} label="My Library" />
            {isAdmin ? (
              <QuickLink to="/admin" icon={<ShieldIcon size={18} />} label="Admin workspace" />
            ) : null}
          </div>
        </Card>

        {/* Session */}
        <Card>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of Parallax Flow on this device.</CardDescription>
          <Button
            variant="danger"
            className="mt-4"
            leftIcon={<LogOutIcon size={18} />}
            onClick={() => void logout()}
          >
            Log out
          </Button>
        </Card>
      </div>
    </>
  );
}
