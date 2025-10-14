// SERVER component (must stay server). Wraps the whole app tree.
import "@/styles/tailwind.css";
import LayoutShell from "./LayoutShell";
import StoreProvider from "@/state/StoreProvider";

export const metadata = {
  title: {
    template: "%s - Studio",
    default: "Studio - Award winning developer studio based in Denmark",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-neutral-950 text-base antialiased">
      <body className="flex min-h-full flex-col">
       
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
