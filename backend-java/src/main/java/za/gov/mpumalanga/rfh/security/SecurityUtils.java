package za.gov.mpumalanga.rfh.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import za.gov.mpumalanga.rfh.exception.ApiException;

@Component
public class SecurityUtils {

	public AuthUser requireUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AuthUser user)) {
			throw new ApiException(401, "No token provided");
		}
		return user;
	}

	public AuthUser requireRoles(String... roles) {
		AuthUser user = requireUser();
		for (String role : roles) {
			if (role.equalsIgnoreCase(user.role())) {
				return user;
			}
		}
		throw new ApiException(403, "Not authorized");
	}

	public AuthUser requirePatient() {
		AuthUser user = requireUser();
		if (!"patient".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only patients can access this endpoint");
		}
		return user;
	}

	public AuthUser requireStaff() {
		AuthUser user = requireUser();
		if (!"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())
				&& !"hr".equalsIgnoreCase(user.role())
				&& !"doctor".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only clinic staff can manage patient records");
		}
		return user;
	}

	public AuthUser requireDoctor() {
		AuthUser user = requireUser();
		if (!"doctor".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only doctors can access this endpoint");
		}
		return user;
	}

	public AuthUser requireAdmin() {
		AuthUser user = requireUser();
		if (!"admin".equalsIgnoreCase(user.role()) && !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Not authorized");
		}
		return user;
	}

	/** Hospital admin or HR officer — people-management modules */
	public AuthUser requireHr() {
		AuthUser user = requireUser();
		if (!"hr".equalsIgnoreCase(user.role())
				&& !"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only HR or hospital admin can access this resource");
		}
		return user;
	}

	/** Finance officer, hospital admin, or super admin — finance modules */
	public AuthUser requireFinance() {
		AuthUser user = requireUser();
		if (!"finance".equalsIgnoreCase(user.role())
				&& !"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only finance or hospital admin can access this resource");
		}
		return user;
	}

	/** Payroll officer, hospital admin, or super admin — payroll modules */
	public AuthUser requirePayroll() {
		AuthUser user = requireUser();
		if (!"payroll".equalsIgnoreCase(user.role())
				&& !"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only payroll or hospital admin can access this resource");
		}
		return user;
	}

	/** Procurement officer, hospital admin, or super admin — procurement modules */
	public AuthUser requireProcurement() {
		AuthUser user = requireUser();
		if (!"procurement".equalsIgnoreCase(user.role())
				&& !"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only procurement or hospital admin can access this resource");
		}
		return user;
	}

	/** Pharmacy officer, hospital admin, or super admin — pharmacy department modules */
	public AuthUser requirePharmacy() {
		AuthUser user = requireUser();
		if (!"pharmacy".equalsIgnoreCase(user.role())
				&& !"admin".equalsIgnoreCase(user.role())
				&& !"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only pharmacy or hospital admin can access this resource");
		}
		return user;
	}

	public AuthUser requireSuperAdmin() {
		AuthUser user = requireUser();
		if (!"super_admin".equalsIgnoreCase(user.role())) {
			throw new ApiException(403, "Only super admin can manage website content");
		}
		return user;
	}
}
