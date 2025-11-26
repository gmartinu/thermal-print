import Reconciler from 'react-reconciler';
import { ReactElement } from 'react';
import { ElementNode } from '@thermal-print/core';

/**
 * Custom React reconciler for rendering React components to ElementNode trees.
 * This replaces the deprecated react-test-renderer with a modern, maintained solution.
 */

interface HostContext {}
interface UpdatePayload {}

// Type for our element instances (what gets created in the host environment)
type Instance = ElementNode;
type TextInstance = ElementNode;
type Container = { root: ElementNode | null };

const reconciler = Reconciler<
  string, // Type (component type)
  Record<string, any>, // Props
  Container, // Container
  Instance, // Instance
  TextInstance, // TextInstance
  never, // SuspenseInstance
  never, // HydratableInstance
  Instance, // PublicInstance
  HostContext, // HostContext
  UpdatePayload, // UpdatePayload
  never, // ChildSet
  number, // TimeoutHandle
  number // NoTimeout
>({
  // Host config
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  // Create instance for element nodes
  createInstance(
    type: string,
    props: Record<string, any>,
    _rootContainer: Container,
    _hostContext: HostContext,
    _internalHandle: any
  ): Instance {
    // Extract style from props
    const style = props.style || {};

    // Filter out children and data attributes from props
    const {
      children,
      'data-thermal-component': componentType,
      'data-size': size,
      'data-wrap': wrap,
      'data-height': height,
      ...restProps
    } = props;

    // Use data-thermal-component if available (for components rendered as HTML elements)
    // Otherwise use the type directly (for direct reconciler usage)
    const actualType = componentType || type;

    // Include size, wrap, height in props if present
    const finalProps = {
      ...restProps,
      ...(size !== undefined ? { size } : {}),
      ...(wrap !== undefined ? { wrap } : {}),
      ...(height !== undefined ? { height } : {})
    };

    return {
      type: actualType,
      props: finalProps,
      children: [],
      style,
    };
  },

  // Create instance for text nodes
  createTextInstance(
    text: string,
    _rootContainer: Container,
    _hostContext: HostContext,
    _internalHandle: any
  ): TextInstance {
    return {
      type: 'TextNode',
      props: { children: text },
      children: [],
      style: {},
    };
  },

  // Append child to parent
  appendInitialChild(parent: Instance, child: Instance | TextInstance): void {
    parent.children.push(child);
  },

  // Finalize the instance after children are added
  finalizeInitialChildren(
    _instance: Instance,
    _type: string,
    _props: Record<string, any>,
    _rootContainer: Container,
    _hostContext: HostContext
  ): boolean {
    return false; // Return true if commitMount should be called
  },

  // Prepare the instance for update
  prepareUpdate(
    _instance: Instance,
    _type: string,
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
    _rootContainer: Container,
    _hostContext: HostContext
  ): UpdatePayload | null {
    // Return update payload if props changed
    return oldProps !== newProps ? {} : null;
  },

  // Check if text should be handled specially
  // IMPORTANT: Always return false to ensure React calls createTextInstance for all text.
  // If this returns true, React skips createTextInstance and expects the host to handle
  // text directly, but we don't implement that - we only handle text via TextNode children.
  shouldSetTextContent(_type: string, _props: Record<string, any>): boolean {
    return false;
  },

  // Get root host context
  getRootHostContext(_rootContainer: Container): HostContext {
    return {};
  },

  // Get child host context
  getChildHostContext(
    _parentHostContext: HostContext,
    _type: string,
    _rootContainer: Container
  ): HostContext {
    return {};
  },

  // Timeout functions (wrapped to handle Node.js vs browser differences)
  scheduleTimeout: (fn: (...args: unknown[]) => unknown, delay?: number) => {
    return setTimeout(fn, delay) as unknown as number;
  },
  cancelTimeout: (id: number) => {
    clearTimeout(id as unknown as NodeJS.Timeout);
  },
  noTimeout: -1,

  // Check if it's a primary renderer
  isPrimaryRenderer: false,

  // Prepare for commit
  prepareForCommit(_containerInfo: Container): Record<string, any> | null {
    return null;
  },

  // Reset after commit
  resetAfterCommit(_containerInfo: Container): void {
    // Nothing to reset
  },

  // Prepare portal mount
  preparePortalMount(_containerInfo: Container): void {
    // Not supported
  },

  // Clear container
  clearContainer(container: Container): void {
    container.root = null;
  },

  // Mutation methods (called during commit phase)
  appendChild(parent: Instance, child: Instance | TextInstance): void {
    parent.children.push(child);
  },

  appendChildToContainer(container: Container, child: Instance): void {
    container.root = child;
  },

  insertBefore(
    parent: Instance,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance
  ): void {
    const index = parent.children.indexOf(beforeChild);
    if (index !== -1) {
      parent.children.splice(index, 0, child);
    }
  },

  insertInContainerBefore(
    container: Container,
    child: Instance,
    _beforeChild: Instance | TextInstance
  ): void {
    container.root = child;
  },

  removeChild(parent: Instance, child: Instance | TextInstance): void {
    const index = parent.children.indexOf(child);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
  },

  removeChildFromContainer(container: Container, _child: Instance): void {
    container.root = null;
  },

  commitUpdate(
    instance: Instance,
    _updatePayload: UpdatePayload,
    _type: string,
    _oldProps: Record<string, any>,
    newProps: Record<string, any>,
    _internalHandle: any
  ): void {
    // Update instance props, filtering out data attributes
    const {
      children,
      style,
      'data-thermal-component': _componentType,
      'data-size': size,
      'data-wrap': wrap,
      'data-height': height,
      ...restProps
    } = newProps;

    // Include size, wrap, height in props if present
    const finalProps = {
      ...restProps,
      ...(size !== undefined ? { size } : {}),
      ...(wrap !== undefined ? { wrap } : {}),
      ...(height !== undefined ? { height } : {})
    };

    instance.props = finalProps;
    instance.style = style || {};
  },

  commitTextUpdate(
    textInstance: TextInstance,
    _oldText: string,
    newText: string
  ): void {
    textInstance.props.children = newText;
  },

  resetTextContent(_instance: Instance): void {
    // Nothing to reset
  },

  commitMount(
    _instance: Instance,
    _type: string,
    _props: Record<string, any>,
    _internalHandle: any
  ): void {
    // Called if finalizeInitialChildren returns true
  },

  getPublicInstance(instance: Instance): Instance {
    return instance;
  },

  // Additional required methods
  getCurrentEventPriority(): number {
    return 0;
  },

  getInstanceFromNode(_node: any): any {
    return null;
  },

  beforeActiveInstanceBlur(): void {
    // Nothing to do
  },

  afterActiveInstanceBlur(): void {
    // Nothing to do
  },

  prepareScopeUpdate(_scopeInstance: any, _instance: any): void {
    // Nothing to do
  },

  getInstanceFromScope(_scopeInstance: any): Instance | null {
    return null;
  },

  detachDeletedInstance(_node: Instance): void {
    // Nothing to do
  },
});

/**
 * Renders a React component to an ElementNode tree using our custom reconciler.
 *
 * This function ignores React hook rule violations and other rendering errors.
 * It will silently catch errors and return whatever was successfully rendered.
 *
 * @param component - The React component to render
 * @returns The rendered ElementNode tree, or null if rendering fails completely
 */
export function renderToElementTree(component: ReactElement): ElementNode | null {
  // Create a container to hold the rendered tree
  const container: Container = { root: null };

  try {
    // Create a reconciler container with silent error handling
    const reconcilerContainer = reconciler.createContainer(
      container,
      0, // tag (0 = legacy mode - more forgiving than concurrent mode)
      null, // hydrationCallbacks
      false, // isStrictMode - disabled to be more lenient
      null, // concurrentUpdatesByDefaultOverride
      '', // identifierPrefix
      // onRecoverableError - silently ignore all recoverable errors (including hook violations)
      () => {
        // Silently ignore - no logging
      },
      null // transitionCallbacks
    );

    // Wrap updateContainer in try-catch to silently handle non-recoverable errors
    try {
      // Render the component into the container
      reconciler.updateContainer(component, reconcilerContainer, null, () => {});

      // Flush all pending work synchronously
      reconciler.flushSync();
    } catch (renderError: any) {
      // Silently ignore and return whatever we have
      return container.root;
    }

    return container.root;
  } catch (error: any) {
    // Silently return partial results if available
    return container.root;
  }
}
