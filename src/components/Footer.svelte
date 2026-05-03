<footer class="main-footer">
	<!-- Logo Section -->
	<section class="logo-section">
		<div class="logo-grid">
			<a href="https://www.moe.go.th" target="_blank" class="logo-link" title="กระทรวงศึกษาธิการ">
				<img src="/assets/images/logos/moe.png" alt="กระทรวงศึกษาธิการ">
			</a>
			<a href="https://www.ocsc.go.th" target="_blank" class="logo-link" title="ก.ค.ศ.">
				<img src="/assets/images/logos/ocsc.png" alt="ก.ค.ศ.">
			</a>
			<a href="https://www.obec.go.th" target="_blank" class="logo-link" title="สพฐ.">
				<img src="/assets/images/logos/obec.png" alt="สพฐ.">
			</a>
			<a href="https://www.otepc.go.th" target="_blank" class="logo-link" title="อปท.">
				<img src="/assets/images/logos/otepc.png" alt="อปท.">
			</a>
			<a href="https://personnel.obec.go.th" target="_blank" class="logo-link" title="ระบบบุคลากร">
				<img src="/assets/images/logos/personnel.png" alt="ระบบบุคลากร">
			</a>
			<a href="https://hrms.moe.go.th" target="_blank" class="logo-link" title="HRMS">
				<img src="/assets/images/logos/hrms.png" alt="HRMS">
			</a>
		</div>
	</section>

	<!-- Footer Content -->
	<div class="footer-content">
		<div class="footer-section">
			<h3>กลุ่มพัฒนาครูและบุคลากรทางการศึกษา</h3>
			<p>ถนนวิเชียรปราการ ตำบลในเมือง อำเภอเมือง จังหวัดชัยนาท 17000</p>
			<p>โทรศัพท์: 056-411639 ต่อ 11</p>
		</div>
		<div class="footer-section">
			<p>&copy; 2025 กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท</p>
		</div>
	</div>
</footer>

<style>
	.main-footer {
		background: var(--primary-purple);
		color: white;
		padding: 2rem 0;
		text-align: center;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		text-align: left;
	}

	.footer-section h3 {
		margin-bottom: 10px;
		color: var(--accent-yellow, #ffc107);
	}

	.footer-section p {
		margin: 5px 0;
		line-height: 1.5;
	}

	.logo-section {
		background: var(--white);
		padding: 3rem 0;
		margin-bottom: 0;
		border-top: 1px solid #eee;
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
		transform: scale(1.1);
		opacity: 0.9;
	}

	.logo-link img {
		width: 100%;
		height: auto;
		max-height: 120px;
		object-fit: contain;
	}

	@media (max-width: 768px) {
		.footer-content {
			grid-template-columns: 1fr;
		}

		.logo-grid {
			grid-template-columns: repeat(2, 1fr) !important;
			gap: 20px !important;
		}

		.logo-link img {
			max-height: 80px !important;
		}
	}
</style>