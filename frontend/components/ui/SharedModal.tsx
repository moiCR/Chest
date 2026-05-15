"use client";

import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { LayoutGroup, motion, type Transition } from "motion/react";
import { Modal, type ModalProps } from "./Modal";

type SharedModalContextValue = {
  groupId: string;
  transition?: Transition;
};

const SharedModalContext = createContext<SharedModalContextValue | null>(null);

const DEFAULT_GROUP_PREFIX = "shared-modal";

function buildGroupId(groupId?: string, fallbackId?: string) {
  return groupId ?? `${DEFAULT_GROUP_PREFIX}-${fallbackId ?? "group"}`;
}

function buildLayoutId(groupId: string, sharedId: string) {
  return `${groupId}:${sharedId}`;
}

export interface SharedModalRootProps {
  children: ReactNode;
  groupId?: string;
  transition?: Transition;
}

export function SharedModalRoot({
  children,
  groupId,
  transition,
}: SharedModalRootProps) {
  const reactId = useId();
  const resolvedGroupId = buildGroupId(groupId, reactId);

  return (
    <SharedModalContext.Provider
      value={{ groupId: resolvedGroupId, transition }}
    >
      <LayoutGroup id={resolvedGroupId}>{children}</LayoutGroup>
    </SharedModalContext.Provider>
  );
}

export interface SharedModalProps extends ModalProps {
  groupId?: string;
  transition?: Transition;
}

export function SharedModal({
  children,
  groupId,
  transition,
  ...modalProps
}: SharedModalProps) {
  const context = useContext(SharedModalContext);
  const reactId = useId();
  const resolvedGroupId = buildGroupId(groupId ?? context?.groupId, reactId);
  const resolvedTransition = transition ?? context?.transition;

  return (
    <SharedModalContext.Provider
      value={{ groupId: resolvedGroupId, transition: resolvedTransition }}
    >
      <Modal {...modalProps}>{children}</Modal>
    </SharedModalContext.Provider>
  );
}

export interface SharedModalElementProps
  extends Omit<ComponentPropsWithoutRef<typeof motion.div>, "layoutId"> {
  sharedId: string;
  groupId?: string;
  transition?: Transition;
}

export function SharedModalElement({
  sharedId,
  groupId,
  transition,
  children,
  ...props
}: SharedModalElementProps) {
  const context = useContext(SharedModalContext);
  const reactId = useId();
  const resolvedGroupId = buildGroupId(groupId ?? context?.groupId, reactId);
  const resolvedTransition = transition ?? context?.transition;

  return (
    <motion.div
      layoutId={buildLayoutId(resolvedGroupId, sharedId)}
      transition={resolvedTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function useSharedModalLayoutId(sharedId: string, groupId?: string) {
  const context = useContext(SharedModalContext);
  const reactId = useId();
  const resolvedGroupId = buildGroupId(groupId ?? context?.groupId, reactId);
  return buildLayoutId(resolvedGroupId, sharedId);
}
