import { createContext, type ReactNode } from 'react';
import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants.js';

export type HostType = 'zpl-label' | 'zpl-box' | 'zpl-text' | 'zpl-barcode' | 'zpl-image';

export interface ElementNode {
  kind: 'element';
  type: HostType;
  props: Record<string, any>;
  children: TreeNode[];
}

export interface TextNode {
  kind: 'text';
  text: string;
}

export type TreeNode = ElementNode | TextNode;

interface Container {
  children: TreeNode[];
}

const HOST_TYPES = new Set<string>(['zpl-label', 'zpl-box', 'zpl-text', 'zpl-barcode', 'zpl-image']);

function propsWithoutChildren(props: Record<string, any>) {
  const { children: _children, ...rest } = props;
  return rest;
}

function insertBefore(list: TreeNode[], child: TreeNode, before: TreeNode) {
  const from = list.indexOf(child);
  if (from >= 0) list.splice(from, 1);
  const at = list.indexOf(before);
  list.splice(at < 0 ? list.length : at, 0, child);
}

function remove(list: TreeNode[], child: TreeNode) {
  const i = list.indexOf(child);
  if (i >= 0) list.splice(i, 1);
}

let currentPriority = DefaultEventPriority;

const hostConfig: any = {
  rendererPackageName: '@caddy-industries/react-zpl',
  rendererVersion: '0.1.0',
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false,
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  warnsIfNotActing: false,

  createInstance(type: string, props: Record<string, any>): ElementNode {
    if (!HOST_TYPES.has(type)) {
      throw new Error(
        `react-zpl: <${type}> is not supported. Use the components from react-zpl (Label, Box, Text, ...) instead of HTML elements.`,
      );
    }
    return { kind: 'element', type: type as HostType, props: propsWithoutChildren(props), children: [] };
  },
  createTextInstance(text: string): TextNode {
    return { kind: 'text', text };
  },
  appendInitialChild(parent: ElementNode, child: TreeNode) {
    parent.children.push(child);
  },
  appendChild(parent: ElementNode, child: TreeNode) {
    remove(parent.children, child);
    parent.children.push(child);
  },
  appendChildToContainer(container: Container, child: TreeNode) {
    remove(container.children, child);
    container.children.push(child);
  },
  insertBefore(parent: ElementNode, child: TreeNode, before: TreeNode) {
    insertBefore(parent.children, child, before);
  },
  insertInContainerBefore(container: Container, child: TreeNode, before: TreeNode) {
    insertBefore(container.children, child, before);
  },
  removeChild(parent: ElementNode, child: TreeNode) {
    remove(parent.children, child);
  },
  removeChildFromContainer(container: Container, child: TreeNode) {
    remove(container.children, child);
  },
  clearContainer(container: Container) {
    container.children = [];
  },
  commitUpdate(instance: ElementNode, _type: string, _old: unknown, next: Record<string, any>) {
    instance.props = propsWithoutChildren(next);
  },
  commitTextUpdate(instance: TextNode, _old: string, next: string) {
    instance.text = next;
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  getRootHostContext: () => ({}),
  getChildHostContext: (parent: object) => parent,
  getPublicInstance: (instance: unknown) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},
  resetTextContent: () => {},
  hideInstance: () => {},
  unhideInstance: () => {},
  hideTextInstance: () => {},
  unhideTextInstance: () => {},
  detachDeletedInstance: () => {},
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,

  setCurrentUpdatePriority(p: number) {
    currentPriority = p;
  },
  getCurrentUpdatePriority: () => currentPriority,
  resolveUpdatePriority: () => currentPriority || DefaultEventPriority,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  shouldAttemptEagerTransition: () => false,
  requestPostPaintCallback: () => {},
  maySuspendCommit: () => false,
  maySuspendCommitOnUpdate: () => false,
  maySuspendCommitInSyncRender: () => false,
  preloadInstance: () => true,
  startSuspendingCommit: () => {},
  suspendInstance: () => {},
  waitForCommitToBeReady: () => null,
  getSuspendedCommitReason: () => null,
  NotPendingTransition: null,
  HostTransitionContext: createContext(null),
  resetFormInstance: () => {},
  bindToConsole: (methodName: string, args: unknown[], badgeName: string) =>
    // biome-ignore lint/suspicious/noConsole: forwarding React dev warnings
    (console as any)[methodName].bind(console, `[${badgeName}]`, ...args),
};

const reconciler = Reconciler(hostConfig);

/** Renders a React element synchronously into a plain node tree. */
export function renderTree(element: ReactNode): TreeNode[] {
  const container: Container = { children: [] };
  let error: unknown;
  const onError = (e: unknown) => {
    error ??= e;
  };
  const root = (reconciler as any).createContainer(
    container,
    1, // ConcurrentRoot
    null,
    false,
    null,
    'zpl',
    onError,
    onError,
    onError,
    () => {},
  );
  (reconciler as any).updateContainerSync(element, root, null, null);
  (reconciler as any).flushSyncWork();
  const children = container.children.slice();
  // Unmount so effects clean up and nothing leaks between renders.
  (reconciler as any).updateContainerSync(null, root, null, null);
  (reconciler as any).flushSyncWork();
  if (error) throw error;
  return children;
}
