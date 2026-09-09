package za.gov.mpumalanga.rfh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String firstName;

	@Column(nullable = false)
	private String lastName;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false)
	private String role = "patient";

	@Column(unique = true)
	private String idNumber;

	private String phoneNumber;
	private String address;
	private String dob;
	private String gender;
	private String emergencyContact;
	private String allergies;
	private String existingConditions;
	private String currentMedications;
	private String previousMedicalInfo;
	private String nextOfKin;

	private String bloodType;
	private String languagePreference = "English";
	private String accessibilityNeeds;
	private String primaryFacility = "Rob Ferreira Hospital";
	private String nextOfKinPhone;
	private String nextOfKinRelation;

	private Boolean ccmddEnrolled = false;

	private String ccmddPickupPoint;
	private String nextCollectionDate;

	private Boolean whatsappConsent = false;

	private Boolean marketingConsent = false;

	private Boolean dataSharingConsent = false;

	private Boolean popiaConsent = false;

	private String preferredChannel = "SMS";

	@Column(nullable = false, columnDefinition = "TEXT")
	private String documents = "[]";

	@Column(nullable = false)
	private Integer onboardingComplete = 0;

	@Column(nullable = false)
	private Boolean smsConsent = false;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (documents == null) {
			documents = "[]";
		}
		if (onboardingComplete == null) {
			onboardingComplete = 0;
		}
		if (smsConsent == null) {
			smsConsent = false;
		}
		if (role == null) {
			role = "patient";
		}
		if (languagePreference == null || languagePreference.isBlank()) {
			languagePreference = "English";
		}
		if (primaryFacility == null || primaryFacility.isBlank()) {
			primaryFacility = "Rob Ferreira Hospital";
		}
		if (ccmddEnrolled == null) {
			ccmddEnrolled = false;
		}
		if (whatsappConsent == null) {
			whatsappConsent = false;
		}
		if (marketingConsent == null) {
			marketingConsent = false;
		}
		if (dataSharingConsent == null) {
			dataSharingConsent = false;
		}
		if (popiaConsent == null) {
			popiaConsent = false;
		}
		if (preferredChannel == null || preferredChannel.isBlank()) {
			preferredChannel = "SMS";
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getIdNumber() {
		return idNumber;
	}

	public void setIdNumber(String idNumber) {
		this.idNumber = idNumber;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getDob() {
		return dob;
	}

	public void setDob(String dob) {
		this.dob = dob;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public String getEmergencyContact() {
		return emergencyContact;
	}

	public void setEmergencyContact(String emergencyContact) {
		this.emergencyContact = emergencyContact;
	}

	public String getAllergies() {
		return allergies;
	}

	public void setAllergies(String allergies) {
		this.allergies = allergies;
	}

	public String getExistingConditions() {
		return existingConditions;
	}

	public void setExistingConditions(String existingConditions) {
		this.existingConditions = existingConditions;
	}

	public String getCurrentMedications() {
		return currentMedications;
	}

	public void setCurrentMedications(String currentMedications) {
		this.currentMedications = currentMedications;
	}

	public String getPreviousMedicalInfo() {
		return previousMedicalInfo;
	}

	public void setPreviousMedicalInfo(String previousMedicalInfo) {
		this.previousMedicalInfo = previousMedicalInfo;
	}

	public String getNextOfKin() {
		return nextOfKin;
	}

	public void setNextOfKin(String nextOfKin) {
		this.nextOfKin = nextOfKin;
	}

	public String getBloodType() {
		return bloodType;
	}

	public void setBloodType(String bloodType) {
		this.bloodType = bloodType;
	}

	public String getLanguagePreference() {
		return languagePreference;
	}

	public void setLanguagePreference(String languagePreference) {
		this.languagePreference = languagePreference;
	}

	public String getAccessibilityNeeds() {
		return accessibilityNeeds;
	}

	public void setAccessibilityNeeds(String accessibilityNeeds) {
		this.accessibilityNeeds = accessibilityNeeds;
	}

	public String getPrimaryFacility() {
		return primaryFacility;
	}

	public void setPrimaryFacility(String primaryFacility) {
		this.primaryFacility = primaryFacility;
	}

	public String getNextOfKinPhone() {
		return nextOfKinPhone;
	}

	public void setNextOfKinPhone(String nextOfKinPhone) {
		this.nextOfKinPhone = nextOfKinPhone;
	}

	public String getNextOfKinRelation() {
		return nextOfKinRelation;
	}

	public void setNextOfKinRelation(String nextOfKinRelation) {
		this.nextOfKinRelation = nextOfKinRelation;
	}

	public Boolean getCcmddEnrolled() {
		return ccmddEnrolled;
	}

	public void setCcmddEnrolled(Boolean ccmddEnrolled) {
		this.ccmddEnrolled = ccmddEnrolled;
	}

	public String getCcmddPickupPoint() {
		return ccmddPickupPoint;
	}

	public void setCcmddPickupPoint(String ccmddPickupPoint) {
		this.ccmddPickupPoint = ccmddPickupPoint;
	}

	public String getNextCollectionDate() {
		return nextCollectionDate;
	}

	public void setNextCollectionDate(String nextCollectionDate) {
		this.nextCollectionDate = nextCollectionDate;
	}

	public Boolean getWhatsappConsent() {
		return whatsappConsent;
	}

	public void setWhatsappConsent(Boolean whatsappConsent) {
		this.whatsappConsent = whatsappConsent;
	}

	public Boolean getMarketingConsent() {
		return marketingConsent;
	}

	public void setMarketingConsent(Boolean marketingConsent) {
		this.marketingConsent = marketingConsent;
	}

	public Boolean getDataSharingConsent() {
		return dataSharingConsent;
	}

	public void setDataSharingConsent(Boolean dataSharingConsent) {
		this.dataSharingConsent = dataSharingConsent;
	}

	public Boolean getPopiaConsent() {
		return popiaConsent;
	}

	public void setPopiaConsent(Boolean popiaConsent) {
		this.popiaConsent = popiaConsent;
	}

	public String getPreferredChannel() {
		return preferredChannel;
	}

	public void setPreferredChannel(String preferredChannel) {
		this.preferredChannel = preferredChannel;
	}

	public String getDocuments() {
		return documents;
	}

	public void setDocuments(String documents) {
		this.documents = documents;
	}

	public Integer getOnboardingComplete() {
		return onboardingComplete;
	}

	public void setOnboardingComplete(Integer onboardingComplete) {
		this.onboardingComplete = onboardingComplete;
	}

	public Boolean getSmsConsent() {
		return smsConsent;
	}

	public void setSmsConsent(Boolean smsConsent) {
		this.smsConsent = smsConsent;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
