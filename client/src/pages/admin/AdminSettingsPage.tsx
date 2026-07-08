import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  ErrorState,
  IconButton,
  Input,
  Skeleton,
  Switch,
  Textarea,
  useToast,
  PlusIcon,
  TrashIcon,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { adminSettingsApi, type AdminSettings } from '../../features/home/home.api';
import { errorMessage } from '../../features/auth/auth.api';

export function AdminSettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminSettingsApi.get });
  const [form, setForm] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: (d: Partial<AdminSettings>) => adminSettingsApi.update(d),
    onSuccess: (s) => {
      setForm(s);
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      void qc.invalidateQueries({ queryKey: ['home', 'info'] });
      toast.success('Saved — students will see the update.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const setAnn = (i: number, patch: Partial<AdminSettings['announcements'][number]>) =>
    setForm((f) =>
      f ? { ...f, announcements: f.announcements.map((a, j) => (j === i ? { ...a, ...patch } : a)) } : f,
    );
  const addAnn = () =>
    setForm((f) => (f ? { ...f, announcements: [...f.announcements, { text: '', active: true }] } : f));
  const removeAnn = (i: number) =>
    setForm((f) => (f ? { ...f, announcements: f.announcements.filter((_, j) => j !== i) } : f));

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Home & broadcast' }]}
        title="Home & broadcast"
        description="Publish announcements and set your Telegram links — shown on every student's home page."
      />

      {q.isLoading || !form ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton shape="block" className="h-56" />
          <Skeleton shape="block" className="h-40" />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>
              Short messages shown at the top of the home page. Add several — they rotate one after
              another. Turn one off to hide it without deleting.
            </CardDescription>
            <div className="mt-4 space-y-3">
              {form.announcements.length === 0 ? (
                <p className="rounded-field border border-dashed border-line py-6 text-center text-sm text-muted">
                  No messages yet. Add one below.
                </p>
              ) : (
                form.announcements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-field border border-line p-3">
                    <div className="min-w-0 flex-1">
                      <Textarea
                        rows={2}
                        value={a.text}
                        onChange={(e) => setAnn(i, { text: e.target.value })}
                        placeholder="Type a message, news update or quote…"
                      />
                      <div className="mt-2">
                        <Switch
                          checked={a.active}
                          onChange={(v) => setAnn(i, { active: v })}
                          label="Active"
                        />
                      </div>
                    </div>
                    <IconButton
                      variant="ghost"
                      aria-label="Remove message"
                      icon={<TrashIcon size={16} />}
                      onClick={() => removeAnn(i)}
                    />
                  </div>
                ))
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PlusIcon size={16} />}
                onClick={addAnn}
              >
                Add message
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Telegram</CardTitle>
            <CardDescription>
              Links behind the Join Group / Join Channel buttons. Leave a field blank to hide that
              button.
            </CardDescription>
            <div className="mt-4 space-y-4">
              <Input
                label="Group invite URL"
                value={form.telegramGroupUrl}
                onChange={(e) => setForm({ ...form, telegramGroupUrl: e.target.value })}
                placeholder="https://t.me/…"
              />
              <Input
                label="Channel URL"
                value={form.telegramChannelUrl}
                onChange={(e) => setForm({ ...form, telegramChannelUrl: e.target.value })}
                placeholder="https://t.me/…"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              loading={save.isPending}
              onClick={() =>
                save.mutate({
                  ...form,
                  announcements: form.announcements.filter((a) => a.text.trim()),
                })
              }
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
