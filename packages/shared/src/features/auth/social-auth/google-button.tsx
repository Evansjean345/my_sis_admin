import { cn } from "cn";
import { siGoogle } from "simple-icons";

import { SimpleIcon } from "@shared/components/simple-icon";
import { Button } from "@shared/components/ui/button";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="secondary" className={cn(className)} {...props}>
      <SimpleIcon icon={siGoogle} className="size-4" />
      Continue with Google
    </Button>
  );
}
