<script setup>
definePageMeta({
    layout: 'dashboard'
})
</script>

<template>
    <div>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p class="mt-1 text-sm text-gray-600">Welcome to your dashboard</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Dashboard cards will go here -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Students</h3>
                <p class="text-3xl font-bold text-blue-600">0</p>
                <p class="text-sm text-gray-500">Total students</p>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Groups</h3>
                <p class="text-3xl font-bold text-green-600">0</p>
                <p class="text-sm text-gray-500">Active groups</p>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Evaluations</h3>
                <p class="text-3xl font-bold text-purple-600">0</p>
                <p class="text-sm text-gray-500">This month</p>
            </div>
        </div>
    </div>
</template>
