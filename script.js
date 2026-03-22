// ============================================
// Meeting Cost Calculator
// ============================================

(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('calculator-form');
    const attendeesInput = document.getElementById('attendees');
    const salarySelect = document.getElementById('salary');
    const customSalaryInput = document.getElementById('custom-salary');
    const durationSelect = document.getElementById('duration');
    const frequencySelect = document.getElementById('frequency');
    const overheadCheckbox = document.getElementById('overhead');
    
    // Result Elements
    const costPerMeetingEl = document.getElementById('cost-per-meeting');
    const costWeeklyEl = document.getElementById('cost-weekly');
    const costMonthlyEl = document.getElementById('cost-monthly');
    const costYearlyEl = document.getElementById('cost-yearly');
    const comparisonListEl = document.getElementById('comparison-list');
    const shareBtn = document.getElementById('share-btn');
    const copyBtn = document.getElementById('copy-btn');
    const shareMessage = document.getElementById('share-message');

    // Constants
    const WORKING_HOURS_PER_YEAR = 2080;
    const WEEKS_PER_YEAR = 52;
    const MONTHS_PER_YEAR = 12;
    const OVERHEAD_MULTIPLIER = 1.4;

    // Frequency multipliers (meetings per year)
    const FREQUENCY_MAP = {
        'once': 1,
        'daily': 260, // 5 days × 52 weeks
        'weekly': 52,
        'biweekly': 26,
        'monthly': 12
    };

    // Things to compare costs to
    const COMPARISONS = [
        { threshold: 100, icon: '☕', text: 'cups of premium coffee' , unitCost: 6 },
        { threshold: 500, icon: '🍕', text: 'team pizza lunches', unitCost: 50 },
        { threshold: 1000, icon: '💻', text: 'MacBook Air laptops', unitCost: 1200 },
        { threshold: 5000, icon: '🎓', text: 'online course subscriptions', unitCost: 300 },
        { threshold: 10000, icon: '✈️', text: 'team offsite trips', unitCost: 5000 },
        { threshold: 20000, icon: '👨‍💻', text: 'months of junior developer salary', unitCost: 5000 },
        { threshold: 50000, icon: '🏠', text: 'months of office rent', unitCost: 3000 },
    ];

    // Initialize
    function init() {
        // Add event listeners for real-time calculation
        attendeesInput.addEventListener('input', calculate);
        salarySelect.addEventListener('change', handleSalaryChange);
        customSalaryInput.addEventListener('input', calculate);
        durationSelect.addEventListener('change', calculate);
        frequencySelect.addEventListener('change', calculate);
        overheadCheckbox.addEventListener('change', calculate);
        
        // Share buttons
        shareBtn.addEventListener('click', shareResult);
        copyBtn.addEventListener('click', copyResult);

        // Initial calculation
        calculate();
    }

    // Handle salary dropdown change
    function handleSalaryChange() {
        if (salarySelect.value === 'custom') {
            customSalaryInput.classList.remove('hidden');
            customSalaryInput.focus();
        } else {
            customSalaryInput.classList.add('hidden');
        }
        calculate();
    }

    // Get current salary value
    function getSalary() {
        if (salarySelect.value === 'custom') {
            return parseFloat(customSalaryInput.value) || 80000;
        }
        return parseFloat(salarySelect.value);
    }

    // Main calculation function
    function calculate() {
        const attendees = parseInt(attendeesInput.value) || 1;
        const salary = getSalary();
        const durationMinutes = parseInt(durationSelect.value);
        const frequency = frequencySelect.value;
        const includeOverhead = overheadCheckbox.checked;

        // Calculate hourly rate
        let hourlyRate = salary / WORKING_HOURS_PER_YEAR;
        
        // Apply overhead if checked
        if (includeOverhead) {
            hourlyRate *= OVERHEAD_MULTIPLIER;
        }

        // Calculate cost per meeting
        const durationHours = durationMinutes / 60;
        const costPerMeeting = attendees * hourlyRate * durationHours;

        // Calculate periodic costs
        const meetingsPerYear = FREQUENCY_MAP[frequency];
        const yearlyTotal = costPerMeeting * meetingsPerYear;
        
        let weeklyTotal = 0;
        let monthlyTotal = 0;

        if (frequency === 'once') {
            weeklyTotal = 0;
            monthlyTotal = 0;
        } else {
            weeklyTotal = yearlyTotal / WEEKS_PER_YEAR;
            monthlyTotal = yearlyTotal / MONTHS_PER_YEAR;
        }

        // Update display
        costPerMeetingEl.textContent = formatCurrency(costPerMeeting);
        costWeeklyEl.textContent = formatCurrency(weeklyTotal);
        costMonthlyEl.textContent = formatCurrency(monthlyTotal);
        costYearlyEl.textContent = formatCurrency(yearlyTotal);

        // Update comparisons
        updateComparisons(yearlyTotal);

        // Store for sharing
        window.currentResult = {
            attendees,
            salary,
            durationMinutes,
            frequency,
            includeOverhead,
            costPerMeeting,
            weeklyTotal,
            monthlyTotal,
            yearlyTotal
        };
    }

    // Update comparison list
    function updateComparisons(yearlyTotal) {
        comparisonListEl.innerHTML = '';

        if (yearlyTotal < 100) {
            comparisonListEl.innerHTML = '<li>Enter meeting details to see comparisons</li>';
            return;
        }

        // Find relevant comparisons
        const relevantComparisons = COMPARISONS.filter(c => yearlyTotal >= c.threshold);
        
        // Take top 3 most relevant
        const topComparisons = relevantComparisons.slice(-3).reverse();

        topComparisons.forEach(comp => {
            const quantity = Math.floor(yearlyTotal / comp.unitCost);
            if (quantity > 0) {
                const li = document.createElement('li');
                li.innerHTML = `${comp.icon} <strong>${quantity.toLocaleString()}</strong> ${comp.text}`;
                comparisonListEl.appendChild(li);
            }
        });

        // Always add coffee comparison for context
        const coffeeCount = Math.floor(yearlyTotal / 6);
        if (!topComparisons.find(c => c.icon === '☕') && coffeeCount > 0) {
            const li = document.createElement('li');
            li.innerHTML = `☕ <strong>${coffeeCount.toLocaleString()}</strong> cups of premium coffee`;
            comparisonListEl.appendChild(li);
        }
    }

    // Format currency
    function formatCurrency(amount) {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        }
        if (amount >= 10000) {
            return '$' + (amount / 1000).toFixed(0) + 'K';
        }
        if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(1) + 'K';
        }
        return '$' + Math.round(amount).toLocaleString();
    }

    // Format for sharing
    function getShareText() {
        const r = window.currentResult;
        if (!r) return '';

        const frequencyText = {
            'once': 'one-time',
            'daily': 'daily',
            'weekly': 'weekly',
            'biweekly': 'bi-weekly',
            'monthly': 'monthly'
        }[r.frequency];

        let text = `💰 Meeting Cost Calculator Results\n\n`;
        text += `📊 ${r.attendees} attendees × ${r.durationMinutes} min ${frequencyText} meeting\n\n`;
        text += `💵 Cost per meeting: ${formatCurrency(r.costPerMeeting)}\n`;
        
        if (r.frequency !== 'once') {
            text += `📅 Weekly: ${formatCurrency(r.weeklyTotal)}\n`;
            text += `📆 Monthly: ${formatCurrency(r.monthlyTotal)}\n`;
            text += `📈 Yearly: ${formatCurrency(r.yearlyTotal)}\n`;
        }
        
        text += `\n🔗 Calculate yours: ${window.location.href}`;
        
        return text;
    }

    // Share result
    async function shareResult() {
        const text = getShareText();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Meeting Cost Calculator Results',
                    text: text,
                    url: window.location.href
                });
                showMessage('Shared successfully!');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    copyToClipboard(text);
                }
            }
        } else {
            copyToClipboard(text);
        }
    }

    // Copy result
    function copyResult() {
        const text = getShareText();
        copyToClipboard(text);
    }

    // Copy to clipboard helper
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showMessage('✓ Copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showMessage('✓ Copied to clipboard!');
        }
    }

    // Show temporary message
    function showMessage(msg) {
        shareMessage.textContent = msg;
        setTimeout(() => {
            shareMessage.textContent = '';
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();