"use client";
import type { ReactNode } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronsUpDown,
  Fingerprint,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LogOut,
  Settings2,
  SpellCheck,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { SessionInfo } from "@/lib/types";
import { VIEW_LABELS, type WorkspaceView } from "@/lib/workspace";

const learning = [
  { view: "dashboard", label: "학습 홈", icon: LayoutDashboard },
  { view: "setup", label: "실전 모의시험", icon: Headphones },
  { view: "bank", label: "문제 라이브러리", icon: BookOpen },
  { view: "history", label: "학습 기록", icon: ChartNoAxesCombined },
  { view: "grammar", label: "문법 노트", icon: SpellCheck },
] as const;
const resources = [
  { view: "guide", label: "시험 가이드", icon: GraduationCap },
  { view: "settings", label: "계정 및 설정", icon: Settings2 },
] as const;
type ShellProps = {
  view: WorkspaceView;
  session: SessionInfo | null;
  busy: boolean;
  onNavigate: (view: WorkspaceView) => void;
  onConnect: () => void;
  onLogout: () => void;
  children: ReactNode;
};

function AppSidebar({
  view,
  session,
  busy,
  onNavigate,
  onConnect,
  onLogout,
}: Omit<ShellProps, "children">) {
  const { isMobile, setOpenMobile } = useSidebar();
  function navigate(next: WorkspaceView) {
    if (isMobile) setOpenMobile(false);
    onNavigate(next);
  }
  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border"
      aria-label="주 메뉴"
    >
      <SidebarHeader className="relative h-16 justify-center px-2">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-10"
            aria-label="메뉴 닫기"
            onClick={() => setOpenMobile(false)}
          >
            <X />
          </Button>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent"
            >
              <a href="/" aria-label="opic studio 홈">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <Headphones className="size-4" />
                </span>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    opic studio
                  </span>
                  <span className="mt-1 truncate text-xs text-muted-foreground">
                    OPIc 말하기 연습
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-4 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>학습</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learning.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    aria-current={
                      view === item.view ||
                      (item.view === "history" && view === "results") ||
                      (item.view === "bank" && view === "practice")
                        ? "page"
                        : undefined
                    }
                    isActive={
                      view === item.view ||
                      (item.view === "history" && view === "results") ||
                      (item.view === "bank" && view === "practice")
                    }
                    onClick={() => navigate(item.view)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>도움말</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resources.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    aria-current={view === item.view ? "page" : undefined}
                    isActive={view === item.view}
                    onClick={() => navigate(item.view)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {session.user.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 gap-1 text-left">
                      <span className="truncate text-sm font-medium">
                        {session.user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session.user.demo
                          ? "체험 계정"
                          : session.sharing
                            ? "ChatGPT 구독 연결됨"
                            : "구독 연결 확인 필요"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  className="w-64"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.user.email || "로컬 체험 계정"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("settings")}>
                    <Settings2 />
                    계정 및 설정
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("history")}>
                    <ChartNoAxesCombined />
                    학습 기록
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={busy} onClick={onLogout}>
                    <LogOut />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  onConnect();
                }}
                tooltip="ChatGPT 연결"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                  <Fingerprint className="size-4" />
                </span>
                <div className="grid flex-1 gap-1 text-left">
                  <span className="text-sm font-medium">ChatGPT 연결</span>
                  <span className="text-xs text-muted-foreground">
                    내 구독으로 평가하기
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label="사이드바 크기 전환" title="사이드바 크기 전환" />
    </Sidebar>
  );
}
export function AppShell({ children, ...props }: ShellProps) {
  return (
    <SidebarProvider>
      <a href="#main" className="skip-link">
        본문 바로가기
      </a>
      <AppSidebar {...props} />
      <SidebarInset className="@container/workspace min-w-0">
        <header className="workspace-topbar">
          <div className="flex min-w-0 items-center gap-4">
            <SidebarTrigger aria-label="사이드바 토글" className="-ml-1" />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <span>학습 공간</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{VIEW_LABELS[props.view]}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {!props.session?.user && (
            <Button size="sm" variant="outline" onClick={props.onConnect}>
              ChatGPT 연결
            </Button>
          )}
        </header>
        <div id="main" className="workspace-content">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
