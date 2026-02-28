<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const error = $derived($page.error);
	const status = $derived(error?.status ?? 404);
	const message = $derived(error?.message ?? 'Page not found');

	function goHome() {
		goto('/');
	}

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>{status} - Page Not Found | Proxifeast</title>
</svelte:head>

<div class="error-page">
	<!-- Background Pattern -->
	<div class="error-bg-pattern"></div>

	<div class="error-container">
		<!-- Error Code -->
		<div class="error-code">
			<span class="error-code-digit">{status}</span>
		</div>

		<!-- Error Title -->
		<h1 class="error-title">
			{#if status === 404}
				Page Not Found
			{:else if status === 403}
				Access Denied
			{:else if status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h1>

		<!-- Error Description -->
		<p class="error-description">
			{#if status === 404}
				Oops! The page you're looking for doesn't exist or has been moved.
			{:else if status === 403}
				Sorry, you don't have permission to access this page.
			{:else if status === 500}
				We're having some trouble on our end. Please try again later.
			{:else}
				{message}
			{/if}
		</p>

		<!-- Helpful Links -->
		<div class="error-actions">
			<button onclick={goHome} class="btn-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
					<polyline points="9 22 9 12 15 12 15 22" />
				</svg>
				Go to Homepage
			</button>
			<button onclick={goBack} class="btn-secondary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Go Back
			</button>
		</div>

		<!-- Decorative Illustration -->
		<div class="error-illustration">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
				<!-- Plate -->
				<ellipse cx="200" cy="220" rx="140" ry="40" fill="#e2e8f0" opacity="0.5" />
				<ellipse
					cx="200"
					cy="210"
					rx="120"
					ry="30"
					fill="#f1f5f9"
					stroke="#cbd5e1"
					stroke-width="2"
				/>

				<!-- Fork -->
				<path d="M100 80 L100 200" stroke="#64748b" stroke-width="4" stroke-linecap="round" />
				<path
					d="M90 90 L90 110 M100 90 L100 110 M110 90 L110 110"
					stroke="#64748b"
					stroke-width="3"
					stroke-linecap="round"
				/>
				<path
					d="M90 200 Q100 220 110 200"
					stroke="#64748b"
					stroke-width="4"
					stroke-linecap="round"
					fill="none"
				/>

				<!-- Knife -->
				<path d="M300 80 L300 200" stroke="#64748b" stroke-width="4" stroke-linecap="round" />
				<path
					d="M300 80 Q315 120 300 160 Q295 180 300 200"
					stroke="#64748b"
					stroke-width="4"
					stroke-linecap="round"
					fill="none"
				/>

				<!-- Question Mark -->
				<text
					x="200"
					y="170"
					font-family="Georgia, serif"
					font-size="100"
					font-weight="bold"
					fill="#f59e0b"
					text-anchor="middle">?</text
				>
				<circle cx="200" cy="200" r="8" fill="#f59e0b" />
			</svg>
		</div>

		<!-- Footer -->
		<p class="error-footer">
			Need help? <a href="https://wa.me/2347068346403" target="_blank" rel="noopener noreferrer"
				>Contact us</a
			>
			or <a href="/about">learn more about Proxifeast</a>
		</p>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		position: relative;
		overflow: hidden;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	.error-bg-pattern {
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
			radial-gradient(circle at 40% 40%, rgba(100, 116, 139, 0.05) 0%, transparent 30%);
	}

	.error-container {
		position: relative;
		z-index: 10;
		text-align: center;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
	}

	.error-code {
		margin-bottom: 1.5rem;
	}

	.error-code-digit {
		font-size: 8rem;
		font-weight: 800;
		line-height: 1;
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
	}

	.error-title {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 1rem;
		letter-spacing: -0.025em;
	}

	.error-description {
		font-size: 1.125rem;
		color: #64748b;
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 3rem;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
	}

	.btn-secondary {
		background: white;
		color: #475569;
		border: 2px solid #e2e8f0;
	}

	.btn-secondary:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
		transform: translateY(-2px);
	}

	.error-illustration {
		margin: 2rem 0;
	}

	.error-illustration svg {
		width: 100%;
		max-width: 400px;
		height: auto;
	}

	.error-footer {
		font-size: 0.875rem;
		color: #94a3b8;
		margin: 0;
	}

	.error-footer a {
		color: #f59e0b;
		text-decoration: none;
		font-weight: 500;
	}

	.error-footer a:hover {
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.error-code-digit {
			font-size: 5rem;
		}

		.error-title {
			font-size: 1.5rem;
		}

		.error-description {
			font-size: 1rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
