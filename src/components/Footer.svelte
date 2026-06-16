<footer class="main-footer">
	<!-- Logo Section -->
	<section class="logo-section">
		<div class="logo-grid">
			<a href="https://www.moe.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="กระทรวงศึกษาธิการ">
				<img src="/assets/images/logos/moe.png" alt="กระทรวงศึกษาธิการ" loading="lazy" decoding="async">
			</a>
			<a href="https://www.ocsc.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="ก.ค.ศ.">
				<img src="/assets/images/logos/ocsc.png" alt="ก.ค.ศ." loading="lazy" decoding="async">
			</a>
			<a href="https://www.obec.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="สพฐ.">
				<img src="/assets/images/logos/obec.png" alt="สพฐ." loading="lazy" decoding="async">
			</a>
			<a href="https://www.otepc.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="อปท.">
				<img src="/assets/images/logos/otepc.png" alt="อปท." loading="lazy" decoding="async">
			</a>
			<a href="https://personnel.obec.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="ระบบบุคลากร">
				<img src="/assets/images/logos/personnel.png" alt="ระบบบุคลากร" loading="lazy" decoding="async">
			</a>
			<a href="https://hrms.moe.go.th" target="_blank" rel="noopener noreferrer" class="logo-link" title="HRMS">
				<img src="/assets/images/logos/hrms.png" alt="HRMS" loading="lazy" decoding="async">
			</a>
		</div>
	</section>

	<div class="footer-content">
		<div class="footer-info">
			<h3>กลุ่มพัฒนาครูและบุคลากรทางการศึกษา</h3>
			<p>ถนนวิเชียรปราการ ตำบลในเมือง อำเภอเมือง จังหวัดชัยนาท 17000</p>
			<p>โทรศัพท์: 056-411639 ต่อ 11</p>
			<p class="footer-copyright">&copy; 2025 กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท</p>
		</div>
	</div>
</footer>

<style>
	.main-footer {
		background: var(--primary-purple-dark);
		color: var(--text-on-primary);
		padding: 2rem 0;
		text-align: center;
	}

	.footer-content {
		max-width: 720px;
		margin: 0 auto;
		padding: 1.25rem 20px 0;
	}

	.footer-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		text-align: center;
	}

	.footer-info h3 {
		margin: 0 0 0.25rem;
		color: var(--accent-yellow, #ffc107);
		font-size: 1.1rem;
		line-height: 1.4;
	}

	.footer-info p {
		margin: 0;
		line-height: 1.55;
		font-size: 0.95rem;
	}

	.footer-copyright {
		margin-top: 0.75rem !important;
		font-size: 0.9rem;
		opacity: 0.9;
		width: 100%;
	}

	.logo-section {
		background: var(--white);
		padding: 3rem 0;
		margin-bottom: 0;
		border-top: 1px solid var(--border-neutral);
	}

	.logo-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(150px, 1fr));
		gap: 40px;
		align-items: center;
		justify-items: center;
		padding: 0 20px;
		max-width: 1000px;
		margin: 0 auto;
	}

	.logo-link {
		display: block;
		transition: transform 0.2s ease, opacity 0.2s ease;
		text-align: center;
	}

	.logo-link:hover {
		opacity: 0.88;
	}

	.logo-link img {
		width: 100%;
		height: auto;
		max-height: 120px;
		object-fit: contain;
	}

	@media (max-width: 768px) {
		.logo-grid {
			grid-template-columns: repeat(2, 1fr) !important;
			gap: 20px !important;
		}

		.logo-link img {
			max-height: 80px !important;
		}

		.footer-info h3 {
			font-size: 1rem;
		}

		.footer-info p {
			font-size: 0.9rem;
		}
	}
</style>
