import { Badge, Button, Card, CardDescription, CardTitle } from '../../components/ui';
import { CheckIcon, ExternalLinkIcon, FileTextIcon, PackageIcon } from '../../components/ui/icons';
import { formatRupees } from '../../lib/format';
import { useDisclosure } from '../../hooks';
import type { Package } from './commerce.api';
import { CheckoutModal } from './CheckoutModal';

/** Reusable package card: title, lesson count, price, owned state, buy action. */
export function PackageCard({
  pkg,
  owned = false,
  onPurchased,
}: {
  pkg: Package;
  owned?: boolean;
  onPurchased: () => void;
}) {
  const checkout = useDisclosure();

  return (
    <Card className="flex h-full flex-col gap-3 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{pkg.title}</CardTitle>
          {pkg.description ? <CardDescription className="mt-1">{pkg.description}</CardDescription> : null}
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-soft-fg"
          aria-hidden="true"
        >
          <PackageIcon size={18} />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral" icon={<FileTextIcon size={13} />}>
          {pkg.lessonCount} lesson{pkg.lessonCount === 1 ? '' : 's'}
        </Badge>
        {owned ? (
          <Badge tone="success" icon={<CheckIcon size={13} />}>Owned</Badge>
        ) : null}
      </div>

      {pkg.lessons && pkg.lessons.length > 0 ? (
        <div className="rounded-field border border-line bg-sunken/40 p-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            What&apos;s inside
          </p>
          <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {pkg.lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm text-fg">
                {l.type === 'pdf' ? (
                  <FileTextIcon size={14} className="shrink-0 text-muted" />
                ) : (
                  <ExternalLinkIcon size={14} className="shrink-0 text-muted" />
                )}
                <span className="truncate">{l.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">One-time</p>
          <p className="font-display text-2xl font-extrabold tabular text-gold-strong">
            {formatRupees(pkg.price)}
          </p>
        </div>
        {owned ? (
          <Button variant="secondary" disabled>
            Owned
          </Button>
        ) : (
          <Button variant="primary" onClick={checkout.open}>
            View / Buy package
          </Button>
        )}
      </div>

      <CheckoutModal
        open={checkout.isOpen}
        onClose={checkout.close}
        item={{ type: 'package', id: pkg.id, title: pkg.title, price: pkg.price }}
        onPurchased={onPurchased}
      />
    </Card>
  );
}
