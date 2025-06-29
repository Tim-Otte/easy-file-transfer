import { arrow, computePosition, flip, offset, shift } from "@floating-ui/dom";
import type { Action } from "svelte/action";

interface TooltipConfig {
    content: string;
    placement?: "top" | "bottom" | "left" | "right";
    duration?: number;
    delay?: number;
    allowHTML?: boolean;
}

export const tooltip: Action<HTMLElement, Partial<TooltipConfig> | string> = (node: HTMLElement, data: Partial<TooltipConfig> | string) => {
    $effect(() => {
        const config: TooltipConfig = { content: '', placement: "bottom" };
        if (typeof data === "string") {
            config.content = data;
        } else {
            Object.assign(config, data);
        }

        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.role = "tooltip";

        if (config.allowHTML === true) {
            tooltip.innerHTML = config.content;
        } else {
            tooltip.textContent = config.content;
        }

        const tooltipArrow = document.createElement("div");
        tooltipArrow.className = "tooltip-arrow";

        tooltip.appendChild(tooltipArrow);
        node.parentNode?.appendChild(tooltip);

        const updatePosition = (): void => {
            computePosition(node, tooltip, {
                placement: config.placement || "bottom",
                middleware: [
                    flip(),
                    shift({ padding: 5 }),
                    offset(8),
                    arrow({ element: tooltipArrow })
                ]
            }).then(({ x, y, placement, middlewareData }) => {
                Object.assign(tooltip.style, {
                    left: `${x}px`,
                    top: `${y}px`
                });

                const { x: arrowX, y: arrowY } = middlewareData.arrow!;
                const side = placement.split('-')[0];

                const staticSide = {
                    top: 'bottom',
                    right: 'left',
                    bottom: 'top',
                    left: 'right',
                }[side];

                tooltipArrow.setAttribute('data-tooltip-placement', side);

                Object.assign(tooltipArrow.style, {
                    left: arrowX != null ? `${arrowX}px` : '',
                    top: arrowY != null ? `${arrowY}px` : '',
                    right: '',
                    bottom: '',
                    [staticSide!]: '-4px',
                });
            });
        };

        let timeout: NodeJS.Timeout | null = null;

        const showTooltip = async (): Promise<void> => {
            if (node.hasAttribute('disabled') || node.classList.contains('disabled')) return;

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            if (config.delay) {
                await new Promise(resolve => setTimeout(resolve, config.delay));
            }

            Object.assign(tooltip.style, {
                opacity: '100%',
                scale: '100%'
            });
            updatePosition();

            timeout = setTimeout(() => hideTooltip(), config.duration || 5000);
        };

        const hideTooltip = (): void => {
            Object.assign(tooltip.style, {
                opacity: '',
                scale: ''
            });
        };

        updatePosition();

        node.addEventListener('mouseenter', showTooltip);
        node.addEventListener('mouseleave', hideTooltip);

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }

            node.removeEventListener('mouseenter', showTooltip);
            node.removeEventListener('mouseleave', hideTooltip);

            tooltipArrow.remove();
            tooltip.remove();
        };
    })
}