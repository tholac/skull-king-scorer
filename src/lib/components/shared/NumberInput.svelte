<script lang="ts">
    let {
        value = $bindable<number>(),
        disabled = false,
        min = Number.NEGATIVE_INFINITY,
        max = Number.POSITIVE_INFINITY,
        step = 1,
        valueName = '',
    }: {
        value: number;
        disabled?: boolean;
        min?: number;
        max?: number;
        step?: number;
        valueName?: string;
    } = $props();

    function decrease() {
        if (disabled) return;
        value = Math.max(min, value - step);
    }

    function increase() {
        if (disabled) return;
        value = Math.min(max, value + step);
    }
</script>

<div class="flex items-center gap-1" class:opacity-50={disabled}>
    <button
        type="button"
        class="btn btn-sm btn-outline w-10"
        aria-label={`Decrease ${valueName}`.trimEnd()}
        onclick={decrease}
        disabled={disabled || value <= min}
    >
        -
    </button>
    <input
        type="number"
        class="input input-bordered w-14 text-center"
        min={min}
        max={max}
        step={step}
        bind:value
        {disabled}
    />
    <button
        type="button"
        class="btn btn-sm btn-outline w-10"
        aria-label={`Increase ${valueName}`.trimEnd()}
        onclick={increase}
        disabled={disabled || value >= max}
    >
        +
    </button>
</div>
