import { redirect } from 'next/navigation';

export default function CatalogoRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/${params.slug}`);
}
