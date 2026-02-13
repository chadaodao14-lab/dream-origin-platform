                        <td className="py-3 px-4 text-sm flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={user.isActivated ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            onClick={() => handleToggleStatus(user.id, user.isActivated)}
                            title={user.isActivated ? "禁用用户" : "激活用户"}
                          >
                            {user.isActivated ? <Lock size={16} /> : <Unlock size={16} />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleChangeRole(user.id, user.role)}
                            title="修改角色"
                          >
                            <Edit2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无用户记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {users && users.total > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页，共 {Math.ceil((users.total || 0) / 10)} 页
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((users.total || 0) / 10)}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>修改用户角色</CardTitle>