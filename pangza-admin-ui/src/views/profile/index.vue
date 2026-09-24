<script setup lang='tsx'>
import UserHeader from './components/UserHeader/index.vue';
import AccountInformation from './components/AccountInformation/index.vue';
import UpdatePassword from './components/UpdatePassword/index.vue';
import Logout from './components/Logout/index.vue';

</script>
<template>
    <t-row>
        <t-col :span="3"></t-col>
        <t-col :span="6">
            <div>
                <UserHeader />
                <AccountInformation />
                <UpdatePassword />
                <Logout />
            </div>
        </t-col>
        <t-col :span="3"></t-col>
    </t-row>
</template>
