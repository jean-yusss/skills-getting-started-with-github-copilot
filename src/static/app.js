document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(text) {
    const htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return String(text).replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        let participantsList = "";
        if (details.participants.length > 0) {
          details.participants.forEach((participant) => {
            participantsList += `
              <li class="participant-item">
                <span class="participant-email">${escapeHtml(participant)}</span>
                <button class="delete-participant-btn" title="Remove participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(participant)}">&#10006;</button>
              </li>
            `;
          });
        } else {
          participantsList = '<li class="empty-participants">No participants yet</li>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants (${details.participants.length}):</strong></p>
            <ul class="participants-list no-bullets">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll(".delete-participant-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");
          if (!activity || !email) return;
          if (!confirm(`Remove ${email} from ${activity}?`)) return;
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: "POST"
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "message success";
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Failed to remove participant.";
              messageDiv.className = "message error";
            }
          } catch (error) {
            messageDiv.textContent = "Error removing participant.";
            messageDiv.className = "message error";
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
