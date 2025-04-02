"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Blocks,
  ChevronsUpDown,
  LogOut,
  MessagesSquare,
  Plus,
  Settings,
  UserCircle,
  UserCog,
} from "lucide-react";
import {
  TbAddressBook, TbBeach,
  TbBuildingCommunity,
  TbCalendarTime, TbCheckbox,
  TbLayoutDashboard,
  TbTargetArrow,
  TbUsers
} from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {useSidebar} from "@/context/sidebar-context";
import Image from "next/image";
import * as React from "react";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function SessionNavBar({ user }: { user?: { name?: string; email?: string } }) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r fixed",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex w-fit items-center gap-2 px-2"
                    >
                      <Image
                          src="/logo.svg"
                          alt="Rethink logo"
                          width={20}
                          height={20}
                          className="rounded"
                      />
                      <motion.li
                          variants={variants}
                          className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                            <>
                              <p className="text-sm font-semibold">Rethink</p>
                              <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50"/>
                            </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <Link href="/error">
                        <UserCog className="h-4 w-4"/> Manage members
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <Link href="/error">
                        <Blocks className="h-4 w-4"/> Integrations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/error" className="flex items-center gap-2">
                        <Plus className="h-4 w-4"/>
                        Create or join an organization
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className=" flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    <Link
                        href="/"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("dashboard") &&
                            "bg-muted text-blue-600",
                        )}
                    >
                      <TbLayoutDashboard className="h-4 w-4"/>{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Dashboard</p>
                        )}
                      </motion.li>
                    </Link>

                    <Separator className="w-full"/>

                    <Link
                        href="/users"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("users") &&
                            "bg-muted text-blue-600",
                        )}
                    >
                      <TbUsers className="h-4 w-4"/>{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Users</p>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                        href="/chat"
                        className={cn(
                            "flex h-8 flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("chat") && "bg-muted text-blue-600",
                        )}
                    >
                      <MessagesSquare className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <div className="ml-2 flex items-center  gap-2">
                              <p className="text-sm font-medium">Chat</p>
                              <Badge
                                  className={cn(
                                      "flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-50 px-1.5 text-blue-600 dark:bg-blue-700 dark:text-blue-300",
                                  )}
                                  variant="outline"
                              >
                                NEW
                              </Badge>
                            </div>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                        href="/timeoffs"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5   transition hover:bg-muted hover:text-primary",

                            pathname?.includes("timeoffs") && "bg-muted text-blue-600",
                        )}
                    >
                      <TbBeach className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Vacations</p>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                        href="/timetracking"
                        className={cn(
                            "flex h-8 flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("timetracking") && "bg-muted text-blue-600",
                        )}
                    >
                      <TbCalendarTime className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <div className="ml-2 flex items-center  gap-2">
                              <p className="text-sm font-medium">Time Tracking</p>
                            </div>
                        )}
                      </motion.li>
                    </Link>


                    <Separator className="w-full" />
                    <Link
                        href="/projects"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("projects") &&
                            "bg-muted text-blue-600",
                        )}
                    >
                      <TbAddressBook className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Projects</p>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                        href="/allocations"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",

                            pathname?.includes("allocations") &&
                            "bg-muted text-blue-600",
                        )}
                    >
                      <TbBuildingCommunity className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-2">
                              <p className="ml-2 text-sm font-medium">Allocations</p>
                            </div>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                        href="/timesheetanalysis"
                        className={cn(
                            "flex h-8 flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                            pathname?.includes("timesheetanalysis") && "bg-muted text-blue-600",
                        )}
                    >
                      <BarChart className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <div className="ml-2 flex items-center  gap-2">
                              <p className="text-sm font-medium">Time Sheet Analysis</p>
                            </div>
                        )}
                      </motion.li>
                    </Link>

                    <Separator className="w-full" />
                    <Link
                        href="/tasks"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5   transition hover:bg-muted hover:text-primary",

                            pathname?.includes("tasks") && "bg-muted text-blue-600",
                        )}
                    >
                      <TbCheckbox className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Tasks</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                        href="/goals"
                        className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5   transition hover:bg-muted hover:text-primary",

                            pathname?.includes("goals") && "bg-muted text-blue-600",
                        )}
                    >
                      <TbTargetArrow className="h-4 w-4" />{" "}
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Goals</p>
                        )}
                      </motion.li>
                    </Link>
                    <Separator className="w-full" />

                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2">
                <Link
                  href="/settings"
                  className="mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5   transition hover:bg-muted hover:text-primary"
                >
                  <Settings className="h-4 w-4 shrink-0" />{" "}
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium"> Settings</p>
                    )}
                  </motion.li>
                </Link>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5  transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {user?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium">Account</p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>
                            {user?.name?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">{user?.name ?? "User"}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {user?.email ?? "user@example.com"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem
                          asChild
                          className="flex items-center gap-2"
                      >
                        <Link href="/profile">
                          <UserCircle className="h-4 w-4"/> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="flex items-center gap-2">
                        <a href="/auth/logout">
                          <LogOut className="h-4 w-4"/> Sign out
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
