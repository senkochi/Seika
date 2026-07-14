import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAdminUsers,
  lockAdminUser,
  unlockAdminUser,
  changeAdminUserRole,
  resetAdminUserPassword,
  setUsersRoleFilter,
  setUsersPage,
  setUsersSize,
} from "../../store/adminSlice";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import type { UserAdminResponse } from "../../api/types";
import { SectionCard } from "../../components/ui/SectionCard";
import { Pagination } from "../../components/ui/Pagination";

import UsersHeader from "../../components/admin/users/UsersHeader";
import UsersTable from "../../components/admin/users/UsersTable";
import UsersTableRow from "../../components/admin/users/UsersTableRow";
import ChangeRoleModal from "../../components/admin/users/ChangeRoleModal";
import ResetPasswordModal from "../../components/admin/users/ResetPasswordModal";

function AdminUsers() {
  const dispatch = useAppDispatch();
  const { users, mutationStatus } = useAppSelector((state) => state.admin);

  const [modalRole, setModalRole] = useState<UserAdminResponse | null>(null);
  const [modalReset, setModalReset] = useState<UserAdminResponse | null>(null);

  const refetch = () =>
    dispatch(
      fetchAdminUsers({
        role: users.filterRole || undefined,
        page: users.page,
        size: users.size,
      }),
    );

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.filterRole, users.page, users.size]);

  const handleLockToggle = async (user: UserAdminResponse) => {
    const action = user.enabled ? lockAdminUser : unlockAdminUser;
    const result = await dispatch(action(user.id));
    if (action.rejected.match(result)) {
      showError((result.payload as string) ?? "Thao tác thất bại");
    } else {
      showSuccess(user.enabled ? `Đã khóa ${user.username}` : `Đã mở khóa ${user.username}`);
    }
  };

  const handleChangeRole = async (role: "STUDENT" | "TEACHER") => {
    if (!modalRole) return;
    const result = await dispatch(changeAdminUserRole({ userId: modalRole.id, role }));
    if (changeAdminUserRole.rejected.match(result)) {
      showError((result.payload as string) ?? "Đổi role thất bại");
    } else {
      showSuccess(`Đã đổi role của ${modalRole.username} → ${role}`);
      setModalRole(null);
    }
  };

  const handleResetPassword = async () => {
    if (!modalReset) return;
    const result = await dispatch(resetAdminUserPassword(modalReset.id));
    if (resetAdminUserPassword.rejected.match(result)) {
      showError((result.payload as string) ?? "Reset thất bại");
    } else {
      showSuccess(`Đã reset mật khẩu cho ${modalReset.username}`);
      setModalReset(null);
    }
  };

  const isMutating = mutationStatus === "loading";
  const isLoading = users.status === "loading" && users.content.length === 0;
  const isFailed = users.status === "failed";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <UsersHeader
        totalElements={users.totalElements}
        filterRole={users.filterRole}
        onFilterChange={(role) => dispatch(setUsersRoleFilter(role))}
        onReload={refetch}
      />

      <SectionCard className="overflow-hidden p-0">
        <div className="overflow-x-auto p-6">
          <UsersTable
            loading={isLoading}
            error={isFailed ? (users.error ?? "Lỗi không xác định") : null}
            empty={users.content.length === 0}
            hasRows={users.content.length > 0}
          >
            {users.content.map((u) => (
              <UsersTableRow
                key={u.id}
                user={u}
                isMutating={isMutating}
                onLockToggle={handleLockToggle}
                onChangeRole={setModalRole}
                onResetPassword={setModalReset}
              />
            ))}
          </UsersTable>
        </div>
        <Pagination
          currentPage={users.page}
          totalPages={users.totalPages}
          totalElements={users.totalElements}
          pageSize={users.size}
          onPageChange={(page) => dispatch(setUsersPage(page))}
          onPageSizeChange={(size) => dispatch(setUsersSize(size))}
        />
      </SectionCard>

      <ChangeRoleModal
        open={modalRole !== null}
        user={modalRole}
        onClose={() => setModalRole(null)}
        onConfirm={handleChangeRole}
        isLoading={isMutating}
      />
      <ResetPasswordModal
        open={modalReset !== null}
        user={modalReset}
        onClose={() => setModalReset(null)}
        onConfirm={handleResetPassword}
        isLoading={isMutating}
      />
    </div>
  );
}

export default AdminUsers;