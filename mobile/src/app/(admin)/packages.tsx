import { Redirect } from 'expo-router';

export default function AdminPackagesRedirect() {
  return <Redirect href="/admin/content?view=paid&kind=packages" />;
}
