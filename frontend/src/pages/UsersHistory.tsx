import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type User = {
  id: number;
  name: string;
  email: string;
  last_access: string | null;
};

type Action = {
  id: number;
  user_id: number;
  incident_id: number | null;
  action_type: string | null;
  details: string | null;
  created_at: string;
  incident_address?: string | null;
};

const fetchUsers = async () => {
  const res = await fetch('/api/admin/users-history', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
};

const fetchUserActivity = async (id: number) => {
  const res = await fetch(`/api/admin/users/${id}/activity`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load activity');
  return res.json();
};

const UsersHistory = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['usersHistory'], queryFn: fetchUsers });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activityQuery = useQuery({
    queryKey: ['userActivity', selectedUser?.id],
    queryFn: () => fetchUserActivity(selectedUser!.id),
    enabled: !!selectedUser,
  });

  const grouped = useMemo(() => {
    const actions: Action[] = activityQuery.data?.data || [];
    const map: Record<string, Action[]> = {};
    actions.forEach(a => {
      const date = new Date(a.created_at);
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    // Sort months descending
    const sortedMonths = Object.keys(map).sort((a, b) => {
      const da = new Date(map[a][0].created_at);
      const db = new Date(map[b][0].created_at);
      return db.getTime() - da.getTime();
    });

    return { map, sortedMonths };
  }, [activityQuery.data]);

  const openUser = (user: User) => {
    setSelectedUser(user);
    setIsOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Users History</h2>

      <Card>
        {isLoading ? (
          <div>Loading...</div>
        ) : isError ? (
          <div>Error loading users</div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ultimul acces</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {(data?.data || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-sm text-muted-foreground">No users found</td>
                </tr>
              ) : (
                (data?.data || []).map((u: User) => (
                  <TableRow key={u.id} className="cursor-pointer" onClick={() => openUser(u)}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.last_access ? new Date(u.last_access).toLocaleString() : 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalii utilizator</DialogTitle>
            <DialogDescription>{selectedUser?.name} — {selectedUser?.email}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {activityQuery.isLoading ? (
              <div>Loading activity...</div>
            ) : activityQuery.isError ? (
              <div>Error loading activity</div>
            ) : (
              <div className="space-y-4">
                {(grouped.sortedMonths || []).map(month => (
                  <div key={month}>
                    <h4 className="font-medium">{month}</h4>
                    <div className="mt-2 space-y-2">
                      {(grouped.map[month] || []).map(a => (
                        <div key={a.id} className="p-2 border rounded">
                          <div className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                          <div className="font-medium">{a.action_type}</div>
                          <div className="text-sm">{a.details ? JSON.stringify(JSON.parse(a.details), null, 2) : ''}</div>
                          {a.incident_id && <div className="text-sm text-muted-foreground">Incident: {a.incident_id} — {a.incident_address || ''}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersHistory;
