import { mails } from "@shared/features/mail/data";
import { MailComponent } from "@shared/features/mail/mail";
import { DEFAULT_MAIL_LAYOUT, MAIL_LAYOUT_COOKIE } from "@shared/features/mail/mail-layout-config";
import { getValueFromCookie } from "@shared/server/server-actions";

export default async function Page() {
  const layoutCookie = await getValueFromCookie(MAIL_LAYOUT_COOKIE);

  return (
    <div className="h-dvh min-h-0 overflow-hidden">
      <MailComponent mails={mails} defaultLayout={layoutCookie ? JSON.parse(layoutCookie) : [...DEFAULT_MAIL_LAYOUT]} />
    </div>
  );
}
